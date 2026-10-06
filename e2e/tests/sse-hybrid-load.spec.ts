import { test, expect, BrowserContext, Page } from '@playwright/test';

interface SseEventRecord {
  event: string;
  data: any;
  receivedAt: number;
}

interface SyntheticClient {
  id: number;
  displayName: string;
  matricula: string;
  token: string;
  events: SseEventRecord[];
  abortController: AbortController;
  close: () => void;
  waitForEvent: (predicate: (evt: SseEventRecord) => boolean, timeoutMs?: number) => Promise<SseEventRecord>;
}

// Native fetch SSE listener implementation
async function startSyntheticSseClient(
  id: number,
  baseUrl: string,
  sessionCode: string,
  token: string
): Promise<SyntheticClient> {
  const abortController = new AbortController();
  const events: SseEventRecord[] = [];
  const listeners: Array<(record: SseEventRecord) => void> = [];

  const url = `${baseUrl}/api/sessions/${sessionCode}/stream?token=${encodeURIComponent(token)}`;

  const client: SyntheticClient = {
    id,
    displayName: `Synthetic_Mage_${id}`,
    matricula: `3000000${id.toString().padStart(2, '0')}`,
    token,
    events,
    abortController,
    close: () => {
      try {
        abortController.abort();
      } catch {}
    },
    waitForEvent: (predicate, timeoutMs = 15000) => {
      return new Promise<SseEventRecord>((resolve, reject) => {
        // First check existing events
        for (const evt of events) {
          if (predicate(evt)) {
            return resolve(evt);
          }
        }

        const timer = setTimeout(() => {
          const idx = listeners.indexOf(onNewEvent);
          if (idx !== -1) listeners.splice(idx, 1);
          reject(new Error(`Timeout (${timeoutMs}ms) waiting for SSE event in SyntheticClient ${id}`));
        }, timeoutMs);

        const onNewEvent = (record: SseEventRecord) => {
          if (predicate(record)) {
            clearTimeout(timer);
            const idx = listeners.indexOf(onNewEvent);
            if (idx !== -1) listeners.splice(idx, 1);
            resolve(record);
          }
        };

        listeners.push(onNewEvent);
      });
    },
  };

  // Start background streaming
  (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        console.error(`Client ${id} failed to connect to SSE stream: ${response.status}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = 'message';
            continue;
          }
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            let parsedData: any = dataStr;
            try {
              parsedData = JSON.parse(dataStr);
            } catch {}

            const record: SseEventRecord = {
              event: currentEvent,
              data: parsedData,
              receivedAt: Date.now(),
            };

            events.push(record);
            for (const listener of [...listeners]) {
              listener(record);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(`Client ${id} SSE connection error:`, err);
      }
    }
  })();

  return client;
}

test.describe('Hybrid Load Test: 50 Concurrent Sessions & SSE Propagation', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost';
  const NUM_REAL_BROWSERS = 5;
  const NUM_SYNTHETIC_CLIENTS = 45; // Total: 50 players + 1 admin
  const CRYSTAL_INITIAL_HP = 1500;

  let adminContext: BrowserContext;
  let adminPage: Page;
  let playerContexts: BrowserContext[] = [];
  let playerPages: Page[] = [];
  let syntheticClients: SyntheticClient[] = [];
  let sessionCode = '';

  test.afterAll(async () => {
    // Cleanup synthetic clients
    for (const client of syntheticClients) {
      client.close();
    }
    // Cleanup browser contexts
    for (const ctx of playerContexts) {
      await ctx.close().catch(() => {});
    }
    if (adminContext) {
      await adminContext.close().catch(() => {});
    }
  });

  test('Should handle 50 concurrent users, propagate SSE under load, and complete battle lifecycle', async ({ browser }) => {
    // -------------------------------------------------------------------------
    // STEP 1: Admin logs in, creates a session with 1500 HP, and opens monitor
    // -------------------------------------------------------------------------
    console.log('[Step 1] Setting up Admin session...');
    adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/admin`);
    await adminPage.fill('input[placeholder="Nome do usuário"]', 'admin');
    await adminPage.fill('input[placeholder="Senha"]', 'admin');
    await adminPage.click('button[type="submit"]');

    // Wait for redirect to admin home
    await adminPage.waitForURL('**/admin/home', { timeout: 10000 });
    console.log('[Step 1] Admin logged in successfully.');
    await expect(adminPage.getByText('Criar Nova Sessão')).toBeVisible();

    // Create a new session with initial crystal HP
    await adminPage.fill('input[placeholder="Ex: 100"]', CRYSTAL_INITIAL_HP.toString());
    
    // Intercept POST /api/sessions response to extract sessionCode reliably
    const createSessionPromise = adminPage.waitForResponse(
      (resp) => resp.url().includes('/api/sessions') && resp.request().method() === 'POST' && resp.status() === 200
    );
    await adminPage.click('button:has-text("Criar Sessão")');
    const createSessionResp = await createSessionPromise;
    const sessionJson = await createSessionResp.json();
    sessionCode = sessionJson.sessionCode;
    expect(sessionCode).toBeTruthy();
    console.log(`[Step 1] Session created with code: ${sessionCode} and HP: ${CRYSTAL_INITIAL_HP}`);

    // Navigate to admin battle monitor for this session
    await adminPage.goto(`${BASE_URL}/admin/battle/${sessionCode}`);
    await adminPage.waitForURL(`**/admin/battle/${sessionCode}`, { timeout: 10000 });
    console.log(`[Step 1] Admin navigated to /admin/battle/${sessionCode}. Waiting for 'Iniciar Partida' button...`);
    const startBtn = adminPage.locator('button:has-text("Iniciar Partida")');
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    console.log('[Step 1] Admin is ready in the battle monitor room.');

    // -------------------------------------------------------------------------
    // STEP 2: 5 Real Browser Contexts join the session lobby
    // -------------------------------------------------------------------------
    console.log(`[Step 2] Launching ${NUM_REAL_BROWSERS} real Chromium browser contexts...`);
    for (let i = 1; i <= NUM_REAL_BROWSERS; i++) {
      const ctx = await browser.newContext();
      playerContexts.push(ctx);
      const page = await ctx.newPage();
      playerPages.push(page);

      await page.goto(`${BASE_URL}/`);
      await page.fill('input[placeholder="Digite seu nome"]', `Mago_Real_${i}`);
      await page.fill('input[placeholder="Digite sua matrícula (mínimo 9 dígitos)"]', `10000000${i}`);
      await page.fill('input[placeholder="Digite o código de sessão"]', sessionCode);
      await page.click('button[type="submit"]:has-text("Entrar na sessão")');

      await page.waitForURL(`**/lobby/${sessionCode}`, { timeout: 10000 });
      await expect(page.getByText(`Mago_Real_${i}`)).toBeVisible();
    }
    console.log(`[Step 2] All ${NUM_REAL_BROWSERS} real browsers successfully joined the lobby.`);

    // -------------------------------------------------------------------------
    // STEP 3: 45 Synthetic Clients join via API and open SSE streams
    // -------------------------------------------------------------------------
    console.log(`[Step 3] Joining ${NUM_SYNTHETIC_CLIENTS} synthetic clients concurrently...`);
    const syntheticJoinPromises = Array.from({ length: NUM_SYNTHETIC_CLIENTS }, async (_, idx) => {
      const id = idx + 1;
      const displayName = `Synthetic_Mage_${id}`;
      const matricula = `3000000${id.toString().padStart(2, '0')}`;

      // Join guest via HTTP POST
      const joinResp = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/join-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, matricula }),
      });

      if (!joinResp.ok) {
        throw new Error(`Synthetic client ${id} join-guest failed: ${joinResp.status} ${await joinResp.text()}`);
      }

      const authData = await joinResp.json();
      const token = authData.token;

      // Start SSE client
      const client = await startSyntheticSseClient(id, BASE_URL, sessionCode, token);
      syntheticClients.push(client);
      return client;
    });

    await Promise.all(syntheticJoinPromises);
    console.log(`[Step 3] All ${NUM_SYNTHETIC_CLIENTS} synthetic clients joined and subscribed to SSE.`);

    // Wait for at least one initial session-update event on synthetic clients
    await Promise.all(
      syntheticClients.map((client) =>
        client.waitForEvent((evt) => evt.event === 'session-update', 10000)
      )
    );
    console.log('[Step 3] Confirmed SSE reception across all 45 synthetic clients.');

    // -------------------------------------------------------------------------
    // STEP 4: Admin starts the match -> Measure SSE propagation latency to all 50 clients
    // -------------------------------------------------------------------------
    console.log('[Step 4] Starting match and measuring SSE broadcast propagation...');
    const startTimestamp = Date.now();

    // Prepare promises waiting for ACTIVE status across all 50 clients
    const syntheticActivePromises = syntheticClients.map(async (client) => {
      const evt = await client.waitForEvent(
        (e) => e.event === 'session-update' && e.data?.status === 'ACTIVE',
        10000
      );
      return evt.receivedAt - startTimestamp;
    });

    const realBrowserActivePromises = playerPages.map(async (page, idx) => {
      await page.waitForURL(`**/battle/${sessionCode}`, { timeout: 10000 });
      await expect(page.locator('input[placeholder="Digite o nome da magia..."]')).toBeVisible({ timeout: 10000 });
      return Date.now() - startTimestamp;
    });

    // Admin clicks "Iniciar Partida"
    await adminPage.click('button:has-text("Iniciar Partida")');

    // Await all 45 synthetic and 5 real browser arrivals
    const syntheticLatencies = await Promise.all(syntheticActivePromises);
    const realLatencies = await Promise.all(realBrowserActivePromises);

    const maxSyntheticLatency = Math.max(...syntheticLatencies);
    const avgSyntheticLatency = Math.round(syntheticLatencies.reduce((a, b) => a + b, 0) / syntheticLatencies.length);

    console.log(`[Step 4] Status ACTIVE propagated successfully:`);
    console.log(`  - Synthetic Clients Average Latency: ${avgSyntheticLatency}ms`);
    console.log(`  - Synthetic Clients Max Latency: ${maxSyntheticLatency}ms`);
    console.log(`  - Real Browsers Transition Latencies: ${realLatencies.join(', ')}ms`);

    // Verify reasonable latency under load (< 2500ms max)
    expect(maxSyntheticLatency).toBeLessThan(2500);

    // -------------------------------------------------------------------------
    // STEP 5: High-Concurrency Combat (Real Browsers + Synthetic Clients)
    // -------------------------------------------------------------------------
    console.log('[Step 5] Triggering high-concurrency spell casting...');

    // 5 real browsers type and cast "Bola de Fogo"
    const realCastPromises = playerPages.map(async (page, idx) => {
      const input = page.locator('input[placeholder="Digite o nome da magia..."]');
      await input.fill('Bola de Fogo');
      await page.click('button:has-text("Conjurar")');
    });

    // 45 synthetic clients send concurrent spell casts via HTTP POST
    const syntheticCastPromises = syntheticClients.map(async (client) => {
      const resp = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/spells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.token}`,
        },
        body: JSON.stringify({ spellName: 'Bola de Fogo' }),
      });
      return resp.ok;
    });

    const [realResults, syntheticResults] = await Promise.all([
      Promise.all(realCastPromises),
      Promise.all(syntheticCastPromises),
    ]);

    const successfulSyntheticCasts = syntheticResults.filter(Boolean).length;
    console.log(`[Step 5] Concurrent casts completed: 5 real browsers + ${successfulSyntheticCasts}/45 synthetic successful.`);
    expect(successfulSyntheticCasts).toBeGreaterThanOrEqual(40);

    // Wait for updated crystal health via SSE on all synthetic clients
    const updatedEvt = await syntheticClients[0].waitForEvent(
      (e) => e.event === 'session-update' && typeof e.data?.crystalHealth === 'number' && e.data.crystalHealth < CRYSTAL_INITIAL_HP,
      10000
    );
    const hpAfterRound1 = updatedEvt.data.crystalHealth;
    console.log(`[Step 5] Crystal health successfully reduced from ${CRYSTAL_INITIAL_HP} to ${hpAfterRound1}`);
    expect(hpAfterRound1).toBeLessThan(CRYSTAL_INITIAL_HP);

    // -------------------------------------------------------------------------
    // STEP 6: Defeating the Crystal to transition session to FINISHED
    // -------------------------------------------------------------------------
    console.log('[Step 6] Finishing off the Crystal...');
    // Rapidly cast until crystal health drops to 0
    let remainingHp = hpAfterRound1;
    let round = 2;
    while (remainingHp > 0 && round <= 5) {
      console.log(`[Step 6] Combat Round ${round}: remaining HP = ${remainingHp}`);
      await Promise.all(
        syntheticClients.slice(0, 30).map(async (client) => {
          await fetch(`${BASE_URL}/api/sessions/${sessionCode}/spells`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${client.token}`,
            },
            body: JSON.stringify({ spellName: 'Pulsar Cósmico' }),
          }).catch(() => {});
        })
      );

      // Wait a short tick for SSE broadcast
      await new Promise((r) => setTimeout(r, 600));
      const latestEvents = syntheticClients[0].events.filter((e) => e.event === 'session-update');
      if (latestEvents.length > 0) {
        remainingHp = latestEvents[latestEvents.length - 1].data?.crystalHealth ?? remainingHp;
      }
      round++;
    }

    // Verify session status FINISHED received by synthetic clients
    console.log('[Step 6] Waiting for FINISHED status event...');
    await Promise.all(
      syntheticClients.map((client) =>
        client.waitForEvent(
          (e) => e.event === 'session-update' && e.data?.status === 'FINISHED',
          15000
        )
      )
    );
    console.log('[Step 6] All 45 synthetic clients received status: FINISHED.');

    // -------------------------------------------------------------------------
    // STEP 7: Admin reveals results -> Assert Ranking podium rendered across screens
    // -------------------------------------------------------------------------
    console.log('[Step 7] Admin revealing game results...');
    
    // Admin screen shows "Revelar Resultados" button in AdminAnalyticsView
    const revealBtn = adminPage.locator('button:has-text("Revelar Resultados")');
    await expect(revealBtn).toBeVisible({ timeout: 15000 });
    await revealBtn.click();

    // Assert that all 5 real browsers transition to WizardRankingResults ("Ranking dos Magos")
    console.log('[Step 7] Verifying WizardRankingResults display on real player browsers...');
    await Promise.all(
      playerPages.map(async (page, idx) => {
        await expect(page.getByText('Ranking dos Magos')).toBeVisible({ timeout: 12000 });
      })
    );
    console.log('[Step 7] "Ranking dos Magos" successfully rendered on all 5 real player contexts!');

    // Assert that all 45 synthetic clients received resultsRevealed: true
    await Promise.all(
      syntheticClients.map((client) =>
        client.waitForEvent(
          (e) => e.event === 'session-update' && e.data?.resultsRevealed === true,
          10000
        )
      )
    );
    console.log('[Step 7] All 45 synthetic clients confirmed resultsRevealed: true.');

    console.log('\n======================================================');
    console.log('✅ ALL LOAD & SSE PROPAGATION ASSERTIONS PASSED (50 Simultaneous Users)');
    console.log('======================================================\n');
  });
});
