package com.msadley.shellspell.service;

import com.msadley.shellspell.dto.SessionResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import java.util.concurrent.locks.ReentrantLock;

@Service
public class SseService {

    private static class SafeSseEmitter {
        private final SseEmitter emitter;
        private final ReentrantLock lock = new ReentrantLock();

        public SafeSseEmitter(SseEmitter emitter) {
            this.emitter = emitter;
        }

        public void send(SseEmitter.SseEventBuilder builder) throws IOException {
            lock.lock();
            try {
                emitter.send(builder);
            } finally {
                lock.unlock();
            }
        }

        public void complete() {
            lock.lock();
            try {
                emitter.complete();
            } finally {
                lock.unlock();
            }
        }
    }

    private final Map<String, List<SafeSseEmitter>> emittersMap = new ConcurrentHashMap<>();
    private final org.springframework.core.task.AsyncTaskExecutor taskExecutor;

    public SseService(@org.springframework.beans.factory.annotation.Qualifier("applicationTaskExecutor") org.springframework.core.task.AsyncTaskExecutor taskExecutor) {
        this.taskExecutor = taskExecutor;
    }

    public SseEmitter register(String code) {
        // Emitter timeout set to 3 minutes
        SseEmitter emitter = new SseEmitter(180_000L);
        SafeSseEmitter safeEmitter = new SafeSseEmitter(emitter);

        emittersMap.computeIfAbsent(code, k -> new CopyOnWriteArrayList<>()).add(safeEmitter);

        emitter.onCompletion(() -> removeEmitter(code, safeEmitter));
        emitter.onTimeout(() -> removeEmitter(code, safeEmitter));
        emitter.onError((ex) -> removeEmitter(code, safeEmitter));

        return emitter;
    }

    public void broadcast(String code, Object response) {
        List<SafeSseEmitter> list = emittersMap.get(code);
        if (list == null) return;

        for (SafeSseEmitter safeEmitter : list) {
            taskExecutor.execute(() -> {
                try {
                    safeEmitter.send(SseEmitter.event()
                            .name("session-update")
                            .data(response));
                } catch (Exception e) {
                    removeEmitter(code, safeEmitter);
                }
            });
        }
    }

    public void broadcastSessionsList(List<SessionResponse> list) {
        broadcast("all_sessions", list);
    }

    public void closeSession(String code) {
        List<SafeSseEmitter> list = emittersMap.remove(code);
        if (list != null) {
            for (SafeSseEmitter safeEmitter : list) {
                taskExecutor.execute(() -> {
                    try {
                        safeEmitter.send(SseEmitter.event()
                                .name("session-deleted")
                                .data("deleted"));
                        safeEmitter.complete();
                    } catch (Exception e) {
                        // Ignore
                    }
                });
            }
        }
    }

    @Scheduled(fixedRate = 20000)
    public void sendHeartbeat() {
        emittersMap.forEach((code, list) -> {
            for (SafeSseEmitter safeEmitter : list) {
                taskExecutor.execute(() -> {
                    try {
                        safeEmitter.send(SseEmitter.event()
                                .comment("ping"));
                    } catch (Exception e) {
                        removeEmitter(code, safeEmitter);
                    }
                });
            }
        });
    }

    private void removeEmitter(String code, SafeSseEmitter safeEmitter) {
        emittersMap.computeIfPresent(code, (key, list) -> {
            list.remove(safeEmitter);
            return list.isEmpty() ? null : list;
        });
    }
}
