# Use lightweight Alpine image
FROM alpine:3.20

# Install sqlite
RUN apk add --no-cache sqlite

# Create a non-root user
RUN addgroup -g 1000 appgroup && adduser -D -u 1000 -G appgroup appuser

WORKDIR /data

# Copy init.sql to container
COPY init.sql /data/init.sql

# Initialize sqlite database if it doesn't exist
RUN sqlite3 /data/sqlite.db < /data/init.sql

# Make sure appuser owns the database and data directory
RUN chown -R 1000:1000 /data

# Expose volume for backend to use
VOLUME ["/data"]

USER appuser

# Keep container alive
CMD ["sleep", "infinity"]
