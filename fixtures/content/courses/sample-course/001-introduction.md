---
title: Introduction
lesson: 1
tags:
  - implemented
objectives:
  - Recognize the purpose of an HTTP status code.
outline:
  - Request and response overview
components:
  - callout
  - diagram
claims:
  - id: c1
    text: HTTP uses a request-response protocol.
    status: verified
    sources:
      - s1
sources:
  - id: s1
    title: HTTP overview
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP
    publisher: MDN
    accessed: "2026-10-20"
estimated_minutes: 8
---
# Introduction

HTTP uses a request-response protocol.[^c1]

```kit:callout
variant: tip
title: Status code shape
body: HTTP status codes contain three digits.
```

```mermaid
flowchart LR
  Client --> Server
  Server --> Response
```

```ts
const successfulStatus: number = 200;
```

[^c1]: [HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP)