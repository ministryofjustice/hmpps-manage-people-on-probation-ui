# Stage: base image
FROM node:20.13-alpine as base

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

RUN addgroup -g 2000 appgroup && \
    adduser -u 2000 -G appgroup -D appuser

WORKDIR /app

# Cache breaking and ensure required build / git args defined
RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)
RUN test -n "$GIT_BRANCH" || (echo "GIT_BRANCH not set" && false)

# Define env variables for runtime health / info
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}
ENV GIT_BRANCH=${GIT_BRANCH}

RUN apk add --no-cache \
    build-base \
    python3 \
    python3-dev \
    make \
    g++

# Stage: build assets
FROM base as build

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

# hadolint ignore=DL3008
RUN apk add --no-cache \
    build-base \
    python3 \
    python3-dev \
    ca-certificates

COPY package*.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci --no-audit

ENV NODE_ENV='production'
ENV SENTRY_AUTH_TOKEN=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
COPY . .
RUN --mount=type=secret,id=sentry SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
    npm run build

RUN npm prune --no-audit --omit=dev

# Stage: copy production assets and dependencies
FROM base

COPY --from=build --chown=appuser:appgroup /app/package.json /app/package-lock.json /app/node_modules ./ 

COPY --from=build --chown=appuser:appgroup /app/assets ./assets
COPY --from=build --chown=appuser:appgroup /app/dist ./dist

EXPOSE 3000 3001

ENV NODE_ENV='production'
USER 2000

CMD [ "npm", "start" ]
