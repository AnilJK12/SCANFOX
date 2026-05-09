# Privacy Balance

A privacy-first browser extension that helps users maintain a healthier balance between productivity and entertainment while browsing platforms like YouTube and Instagram.

Instead of aggressively blocking content or enforcing strict screen-time limits, Privacy Balance focuses on soft behavioral guidance, local content analysis, and goal-aware reminders to reduce unconscious scrolling and attention drift.

## Overview

Modern recommendation systems are heavily optimized for:

- engagement
- watch time
- retention
- continuous scrolling

As a result, users often:

- lose track of time
- drift away from their goals
- consume content unintentionally
- experience constant attention switching

Most existing productivity tools rely on:

- hard blocking
- strict restrictions
- app lock systems
- forced limits

These approaches can feel frustrating and are often disabled by users after some time.

Privacy Balance takes a different approach.

The extension is designed to encourage healthier browsing behavior through awareness, balance, and soft intervention instead of punishment.

## Core Philosophy

Privacy Balance does not try to completely remove entertainment from the user's life.

The goal is to:

- help users stay mentally aligned with their goals
- reduce unnecessary attention drift
- encourage intentional browsing
- create a balance between productive and relaxing content
- avoid burnout caused by excessive restrictions

The user always remains in control.

## Features

### Goal-Based Onboarding

During first-time setup, the extension asks users about:

- profession
- interests
- goals
- preferred strictness level

Example:

```text
Profession: Student
Goal: Cybersecurity
Interests: Coding, Technology
Mode: Balanced
```

The information is stored locally using Chrome storage.

### Lightweight Content Classification

The extension analyzes visible page information such as:

- titles
- captions
- hashtags
- visible text

Content is classified into categories like:

- productive
- neutral
- distracting

The current system uses lightweight local keyword scoring to avoid heavy resource usage and preserve privacy.

### Session Tracking

Privacy Balance tracks:

- productive content sessions
- distracting content sessions
- browsing patterns
- scrolling behavior
- session balance

This helps the extension detect attention drift over time instead of reacting to a single piece of content.

### Soft Reminder System

When browsing behavior becomes heavily distraction-oriented, the extension displays gentle reminders such as:

```text
You said your goal is cybersecurity. Are you sure you want to continue scrolling?
```

The extension does not force users to stop.

Users can:

- ignore reminders
- continue browsing
- adjust strictness anytime

## Privacy-First Design

Privacy Balance is built with privacy as a core principle.

Current privacy goals:

- local processing
- no cloud-based browsing analysis
- no personal data collection
- no external tracking
- no remote analytics

Most analysis happens directly inside the browser.

User browsing data is intended to remain on-device.

## Tech Stack

- HTML
- CSS
- JavaScript
- Chrome Extension APIs
- Chrome Local Storage

## Project Structure

```text
privacy-balance/
├── manifest.json
├── background/
├── content/
├── popup/
├── settings/
├── assets/
└── README.md
```

## Current Status

Privacy Balance is currently an:

- early prototype
- experimental project
- concept validation stage extension

The system is functional but still under active development and improvement.

## Current Limitations

### Keyword-Based Classification

The current classification system is relatively simple and may misclassify some content.

Examples:

- educational entertainment
- motivational content
- memes related to learning
- mixed-topic videos

### Browser Limitations

Some platforms:

- dynamically load content
- hide metadata
- aggressively optimize feeds

This makes accurate analysis more difficult, especially on short-form platforms.

### Platform Challenges

Platforms like:

- YouTube Shorts
- Instagram Reels
- TikTok-style feeds

are intentionally designed for rapid content switching, making behavioral analysis more challenging.

## Future Improvements

Planned ideas for future versions:

- smarter content classification
- lightweight local AI models
- behavioral pattern learning
- improved balance scoring
- focus analytics dashboard
- active tab awareness
- cross-browser support
- adaptive reminder system
- improved contextual understanding

## Long-Term Vision

Privacy Balance aims to explore a different relationship between users and recommendation systems.

The long-term vision is to create tools that:

- support intentional browsing
- protect user attention
- encourage healthier digital habits
- preserve user privacy
- provide guidance without removing freedom

## Why This Project Exists

Short-form content platforms can heavily influence:

- focus
- motivation
- attention span
- daily productivity

Even small browsing sessions can quickly turn into long periods of distraction.

Privacy Balance started as an attempt to build a healthier browsing experience that encourages awareness and balance instead of strict control.

## Installation

### Developer Mode Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/privacy-balance.git
```

2. Open Chrome and go to:

```text
chrome://extensions/
```

3. Enable:

Developer Mode


4. Click:

Load Unpacked
```

5. Select the project folder.

## Disclaimer

Privacy Balance is an experimental project and should not be considered a medical, psychological, or mental health solution.

The extension is intended only as a lightweight productivity and awareness tool.

## Contributing

Contributions, suggestions, and feedback are welcome.

Possible contribution areas:

- classification improvements
- UI/UX enhancements
- performance optimization
- local AI experimentation
- browser compatibility
- accessibility improvements

## License

MIT License

## Author

Built by a developer interested in:

- privacy-first systems
- behavioral technology
- productivity tools
- cybersecurity
- healthier digital experiences
