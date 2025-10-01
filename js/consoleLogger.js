/**
 * Console Logger - Captures and displays console messages in the UI
 * Intercepts console.log, console.warn, and console.error calls
 */

class ConsoleLogger {
  constructor() {
    this.messages = [];
    this.container = null;
    this.placeholder = null;
    this.isCollapsed = false;
    this.maxMessages = 1000; // Limit to prevent memory issues

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }

    // Override console methods
    this.overrideConsole();
  }

  setupUI() {
    this.container = document.getElementById('consoleLogContainer');
    this.placeholder = this.container?.querySelector('.console-placeholder');

    if (!this.container) {
      console.error('Console log container not found');
      return;
    }

    // Setup event listeners
    this.setupEventListeners();

    // Add initial message to show the system is working
    this.addMessage('log', 'consoleLogger.js:45', 'Console logger initialized successfully');
  }

  setupEventListeners() {
    const clearBtn = document.getElementById('clearConsoleBtn');
    const toggleBtn = document.getElementById('toggleConsoleBtn');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearMessages());
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleConsole());
    }
  }

  overrideConsole() {
    console.log = (...args) => {
      this.originalConsole.log(...args);
      const location = this.getCallerLocation();
      this.addMessage('log', location, ...args);
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      const location = this.getCallerLocation();
      this.addMessage('warn', location, ...args);
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      const location = this.getCallerLocation();
      this.addMessage('error', location, ...args);
    };
  }

  addMessage(type, location, ...args) {
    if (!this.container) return;

    const timestamp = new Date();
    const message = {
      type,
      timestamp,
      location,
      content: args,
      id: Date.now() + Math.random()
    };

    this.messages.push(message);

    // Limit messages to prevent memory issues
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this.renderMessage(message);
    this.scrollToBottom();
  }

  renderMessage(message) {
    if (!this.container) return;

    // Remove placeholder if it exists
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.remove();
      this.placeholder = null;
    }

    const entry = document.createElement('div');
    entry.className = 'console-entry';
    entry.setAttribute('data-id', message.id);

    const timestamp = document.createElement('div');
    timestamp.className = 'console-timestamp';
    timestamp.textContent = this.formatTimestamp(message.timestamp);

    const typeLabel = document.createElement('div');
    typeLabel.className = `console-type ${message.type}`;
    typeLabel.textContent = message.type;

    const locationLabel = document.createElement('div');
    locationLabel.className = 'console-location';
    locationLabel.textContent = message.location || '';

    const messageContent = document.createElement('div');
    messageContent.className = 'console-message';
    messageContent.innerHTML = this.formatMessage(message.content);

    entry.appendChild(timestamp);
    entry.appendChild(typeLabel);
    entry.appendChild(locationLabel);
    entry.appendChild(messageContent);

    this.container.appendChild(entry);

    // Remove old messages if we have too many DOM elements
    const entries = this.container.querySelectorAll('.console-entry');
    if (entries.length > this.maxMessages) {
      entries[0].remove();
    }
  }

  formatTimestamp(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  formatMessage(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return `<span class="console-object">${JSON.stringify(arg, null, 2)}</span>`;
        } catch (e) {
          return `<span class="console-object">[Object]</span>`;
        }
      } else if (typeof arg === 'string') {
        return `<span class="console-string">${this.escapeHtml(arg)}</span>`;
      } else if (typeof arg === 'number') {
        return `<span class="console-number">${arg}</span>`;
      } else if (typeof arg === 'boolean') {
        return `<span class="console-boolean">${arg}</span>`;
      } else {
        return `<span>${this.escapeHtml(String(arg))}</span>`;
      }
    }).join(' ');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearMessages() {
    if (!this.container) return;

    this.messages = [];
    this.container.innerHTML = '<div class="console-placeholder">Console messages will appear here...</div>';
    this.placeholder = this.container.querySelector('.console-placeholder');
  }

  toggleConsole() {
    if (!this.container) return;

    const toggleBtn = document.getElementById('toggleConsoleBtn');
    const toggleIcon = toggleBtn?.querySelector('svg path');

    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      this.container.classList.add('collapsed');
      if (toggleBtn) toggleBtn.textContent = '';
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6"></path>
          </svg>
          Expand
        `;
      }
    } else {
      this.container.classList.remove('collapsed');
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
          Collapse
        `;
      }
    }
  }

  scrollToBottom() {
    if (!this.container) return;

    // Small delay to ensure the message is rendered
    setTimeout(() => {
      this.container.scrollTop = this.container.scrollHeight;
    }, 10);
  }

  // Public method to restore original console (if needed for debugging)
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  // Method to extract caller location from stack trace
  getCallerLocation() {
    try {
      const stack = new Error().stack;
      if (!stack) return '';

      const stackLines = stack.split('\n');
      
      // Look for the first stack frame that's not this file or console methods
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i];
        
        // Skip lines that contain consoleLogger.js or are console method calls
        if (line.includes('consoleLogger.js') || 
            line.includes('console.log') || 
            line.includes('console.warn') || 
            line.includes('console.error')) {
          continue;
        }

        // Look for file path and line number patterns
        const match = line.match(/(?:at\s+)?(?:.*?\s+)?\(?([^()]+):(\d+):(\d+)\)?/);
        if (match) {
          const [, filePath, lineNum, colNum] = match;
          
          // Extract just the filename from the full path
          const fileName = filePath.split('/').pop() || filePath;
          
          return `${fileName}:${lineNum}`;
        }
      }
      
      return '';
    } catch (e) {
      return '';
    }
  }

  // Public method to get all messages (for export/debugging)
  getMessages() {
    return this.messages;
  }
}

// Initialize console logger when script loads
window.consoleLogger = new ConsoleLogger();
