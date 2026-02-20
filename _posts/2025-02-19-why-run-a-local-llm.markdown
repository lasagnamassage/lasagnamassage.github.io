---
layout: post
title:  "Why Run a Local LLM (and How to Do It)"
date:   2026-02-19 17:44:30 -0800
categories: jekyll update
---

Ok, so you've been hitting up ChatGPT or Claude for your code, your drafts, your weird hypotheticals—and somewhere in the back of your head you're wondering where all that text actually goes. I'm not here to fear-monger, but if you've ever thought *"yo, I don't really want Palantir or the feds data-mining my queries"* or *"I just pasted a stack trace with an API key in it"*… you're in the right place. Let's talk about what a local LLM is, why you might need one, and how to get Ollama and DeepSeek running on your own machine so your business stays your business.

## What is a local LLM?

A **local LLM** is a large language model that runs on *your* hardware—your laptop, your desktop, your homelab server—instead of in some vendor's cloud. Same idea as the models behind ChatGPT or Gemini: you send it text, it sends back text. The difference is that the compute happens on your device. No round-trip to OpenAI, Google, or whoever. No account, no API key (unless you want one for something else), and no log of your prompts sitting on a server you don't control. Think of it like having the DJ in your living room instead of streaming the set from a club where everyone's watching who's requesting what.

## Why do you need one?

### Your queries don't need to touch the cloud

When you use a cloud LLM, your prompts and sometimes your data are sent over the internet to that company's servers. They can log them, train on them (depending on the product and settings), or hand them over when legally compelled. With a local model, the flow is simple: your machine → the model on your machine → the answer back to you. Nothing has to leave your network. You can literally prove it: run something like [Wireshark](https://www.wireshark.org/download.html) to watch that your LLM traffic never hits an external IP.

### So Palantir (or the government) can't study you

A lot of folks don't care until they do. Maybe you're working on something sensitive, writing about health stuff, or you just don't want your coding questions or half-baked ideas ending up in a training set or an analyst's dashboard. Cloud providers have terms of service and privacy policies, but at the end of the day your data is on their infrastructure. Contracts get subpoenaed; data gets shared with government and big-data partners in plenty of jurisdictions. Running the model yourself means there's no middleman to subpoena for *your* prompts. The only way someone gets that data is if they get your machine—and that's a whole different threat model you can actually lock down.

### PII and security risks when you *don't* go local

**PII** (personally identifiable information) is any data that can identify a specific person—names, emails, phone numbers, addresses, social security numbers, health info, and the like. Pasting logs, stack traces, or user data into a cloud chatbot is a classic way to leak PII, API keys, or internal design. One typo, one "paste this error," and you've just sent customer data or credentials to a third party. With a local LLM, that sensitive context never leaves your box. You can refactor code that touches real user data, debug production-like errors, and brainstorm product ideas without worrying that a copy of it is sitting in a vendor's logs or training pipeline. It's not paranoia—it's just reducing the blast radius when (not if) someone pastes the wrong thing.

So: if you care about privacy, want to *prove* your prompts stay off the internet, or you're tired of worrying about PII and keys in cloud chat—running a local LLM is one of the cleanest moves. No middleman, no server to study you. Run it local, keep it on the low.

## How to install Ollama and DeepSeek

**Ollama** is the easiest way to run open-weight models on your Mac or Linux box. One binary, simple CLI, no GPU required (though it helps). Here's the rundown.

### Install Ollama

**macOS / Linux** — run the official install script in your terminal:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

That's it. Ollama runs as a background service. You can confirm it's up by opening [http://localhost:11434](http://localhost:11434) in your browser or by running `ollama list` in the terminal.

**Windows** — grab the installer from [ollama.com/download](https://ollama.com/download) or run the PowerShell one-liner from their site. Same idea: install, Ollama runs, you talk to it via CLI or whatever front-end you hook up.

### Pull and run DeepSeek

DeepSeek is a strong open model—good for code, reasoning, and general chat. Once Ollama is installed, you pull the model and run it locally:

```bash
ollama pull deepseek-r1
```

Or if you want the code-focused variant:

```bash
ollama pull deepseek-coder
```

Then start a chat:

```bash
ollama run deepseek-r1
```

You're now chatting with a model that's running on your machine. No account, no API key, no data leaving your network. You can also use the same model from code (e.g. over the local API), from a UI like Open WebUI or Msty, or just keep it in the terminal.

---

So there you go: what a local LLM is, why it matters for privacy and PII, and how to get Ollama and DeepSeek running so you can keep your queries off the server and out of anyone else's analytics.
