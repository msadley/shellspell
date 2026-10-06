# Stage 1: Development stage
FROM --platform=$BUILDPLATFORM maven:3.9.6-eclipse-temurin-21-alpine AS development
WORKDIR /app

# Copy the pom.xml and dependencies definition
COPY pom.xml .

# Download project dependencies (offline mode helps cache them in docker layers)
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

EXPOSE 8080

CMD ["mvn", "spring-boot:run"]

# Stage 2: Build stage
FROM development AS build
# Build the application package
RUN mvn clean package -DskipTests

# Stage 3: Create runtime image (Production)
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy the jar built in the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
