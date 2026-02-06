// Terminal Implementation
(function() {
  'use strict';

  // Blog posts data - loaded from Jekyll via window.jekyllPosts
  let blogPosts = [];

  // Parse posts from Jekyll data or fallback to page parsing
  function parsePostsFromPage() {
    // First try to use Jekyll data if available
    if (window.jekyllPosts && Array.isArray(window.jekyllPosts)) {
      blogPosts = window.jekyllPosts.map(post => {
        // Extract slug from URL if not provided
        let slug = post.slug || '';
        if (!slug && post.url) {
          const urlParts = post.url.split('/').filter(Boolean);
          slug = urlParts.length > 0 ? urlParts[urlParts.length - 1].replace(/\.html$/, '') : '';
        }
        return {
          title: post.title || '',
          slug: slug,
          date: post.date || '',
          url: post.url || '',
          excerpt: post.excerpt || ''
        };
      });
      return;
    }

    // Fallback: parse from page if available
    try {
      const postLinks = document.querySelectorAll('.post-link');
      if (postLinks.length > 0) {
        blogPosts = [];
        postLinks.forEach(link => {
          const title = link.textContent.trim();
          const url = link.getAttribute('href');
          const slug = url ? url.split('/').filter(Boolean).pop() : '';
          const meta = link.closest('li')?.querySelector('.post-meta');
          const date = meta ? meta.textContent.trim() : '';
          blogPosts.push({ title, slug, date, url, excerpt: '' });
        });
      }
    } catch (e) {
      console.warn('Could not parse posts from page:', e);
    }
  }

  // Terminal state
  let commandHistory = [];
  let historyIndex = -1;
  let terminalInput;
  let terminalOutput;
  let terminalCursor;
  let currentCommand = '';
  let isDisplayingBlogContent = false;

  // Initialize terminal
  function initTerminal() {
    // Parse posts from fallback content if available
    parsePostsFromPage();

    const container = document.querySelector('.terminal-container');
    if (!container) return;

    terminalOutput = container.querySelector('.terminal-output');
    terminalInput = container.querySelector('.terminal-input');
    terminalCursor = container.querySelector('.cursor');
    
    if (!terminalInput || !terminalOutput) return;

    // Focus input
    terminalInput.focus();

    // Event listeners
    terminalInput.addEventListener('keydown', handleKeyDown);
    terminalInput.addEventListener('input', handleInput);
    terminalInput.addEventListener('keyup', updateCursorPosition);
    terminalInput.addEventListener('click', updateCursorPosition);
    terminalInput.addEventListener('select', updateCursorPosition);
    
    // Initial cursor position
    updateCursorPosition();

    // Click on output to focus input (but not when selecting text)
    let isSelecting = false;
    let mouseDownTime = 0;
    let mouseDownX = 0;
    let mouseDownY = 0;
    
    terminalOutput.addEventListener('mousedown', (e) => {
      mouseDownTime = Date.now();
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
      isSelecting = false;
    });
    
    terminalOutput.addEventListener('mousemove', (e) => {
      // If mouse moves significantly, user is likely selecting text
      if (mouseDownTime > 0) {
        const deltaX = Math.abs(e.clientX - mouseDownX);
        const deltaY = Math.abs(e.clientY - mouseDownY);
        if (deltaX > 3 || deltaY > 3) {
          isSelecting = true;
        }
      }
    });
    
    terminalOutput.addEventListener('mouseup', (e) => {
      // Check if user was selecting text
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;
      const timeDiff = Date.now() - mouseDownTime;
      
      // Only focus if:
      // 1. No text is selected
      // 2. User wasn't dragging (or dragged very little)
      // 3. It was a quick click (not a long press)
      if (!hasSelection && !isSelecting && timeDiff < 300) {
        const target = e.target;
        // Don't focus if clicking on a link
        if (target && target.tagName !== 'A' && !target.closest('a')) {
          terminalInput.focus();
        }
      }
      
      // Reset
      mouseDownTime = 0;
      isSelecting = false;
    });

    // Initial welcome message
    showWelcomeMessage();
  }

  // Reset terminal to initial state
  function resetTerminal() {
    // Check if we're on a /terminal/... URL and need to navigate back to home
    const pathname = window.location.pathname;
    const isTerminalPostView = pathname.match(/^\/terminal\//);
    
    if (isTerminalPostView) {
      // When viewing a post via /terminal/..., navigate back to home
      window.location.href = '/';
      return;
    }
    
    // Get the main terminal output (not post view)
    const mainOutput = document.querySelector('.terminal-container .terminal-output');
    if (!mainOutput) return;
    
    // If we're in post view, switch back to main terminal
    const postContainer = document.querySelector('.terminal-container.post-view');
    if (postContainer) {
      // Remove post view and show main terminal
      const mainContainer = document.querySelector('.terminal-container:not(.post-view)');
      if (mainContainer) {
        mainContainer.style.display = 'flex';
        postContainer.remove();
      }
      // Reset global references
      terminalOutput = mainOutput;
      window.terminalOutput = mainOutput;
    }
    
    // Reset blog content flag
    isDisplayingBlogContent = false;
    window.isDisplayingBlogContent = false;
    
    // Remove reading progress bar
    removeReadingProgressBar();
    
    // Clear and show welcome message
    mainOutput.innerHTML = '';
    showWelcomeMessage();
  }

  // Show welcome message
  function showWelcomeMessage() {
    const outputEl = terminalOutput || window.terminalOutput || document.querySelector('.terminal-container .terminal-output');
    if (!outputEl) return;
    
    // Add greeting
    const greeting = document.createElement('div');
    greeting.className = 'terminal-line terminal-info kirby-container';
    greeting.textContent = "Welcome to the blog!";
    outputEl.appendChild(greeting);
    
    // Create static ASCII art container
    const asciiLine = document.createElement('div');
    asciiLine.className = 'terminal-line terminal-info kirby-container';
    
    const asciiPre = document.createElement('pre');
    asciiPre.className = 'ascii-art-banner';
    
    // Embed ASCII art directly (preserving newlines)
    const asciiArt = `       d8888 d8b  .d8888b.  888                                      88888888888 888                                               
      d88888 88P d88P  Y88b 888                                          888     888                                               
     d88P888 8P  Y88b.      888                                          888     888                                               
    d88P 888 "    "Y888b.   88888b.   8888b.  888  888 88888b.           888     88888b.   .d88b.  88888b.d88b.   8888b.  .d8888b  
   d88P  888         "Y88b. 888 "88b     "88b 888  888 888 "88b          888     888 "88b d88""88b 888 "888 "88b     "88b 88K      
  d88P   888           "888 888  888 .d888888 888  888 888  888          888     888  888 888  888 888  888  888 .d888888 "Y8888b. 
 d8888888888     Y88b  d88P 888  888 888  888 Y88b 888 888  888          888     888  888 Y88..88P 888  888  888 888  888      X88 
d88P     888      "Y8888P"  888  888 "Y888888  "Y88888 888  888          888     888  888  "Y88P"  888  888  888 "Y888888  88888P' `;
    
    asciiPre.textContent = asciiArt;
    asciiLine.appendChild(asciiPre);
    outputEl.appendChild(asciiLine);
    
    // Add subtitle
    const subtitle = document.createElement('div');
    subtitle.className = 'terminal-line terminal-info subtitle-centered';
    subtitle.textContent = '[ Full Stack Software Engineer ]';
    outputEl.appendChild(subtitle);
    
    // Add wrapper for vertical centering
    const helpTextWrapper = document.createElement('div');
    helpTextWrapper.className = 'help-text-wrapper';
    
    const helpText = document.createElement('div');
    helpText.className = 'terminal-line terminal-info help-text-mobile-center';
    helpText.textContent = "Type 'help' and press enter to see available commands.";
    
    helpTextWrapper.appendChild(helpText);
    outputEl.appendChild(helpTextWrapper);
    scrollToBottom();
  }

  // Handle keyboard input
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentCommand.trim());
      currentCommand = '';
      terminalInput.value = '';
      historyIndex = -1;
      updateCursorPosition();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      // Update cursor position after arrow key navigation
      setTimeout(updateCursorPosition, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex < 0) {
          historyIndex = commandHistory.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
        terminalInput.value = commandHistory[historyIndex];
        currentCommand = commandHistory[historyIndex];
        // Update cursor position after setting value
        setTimeout(updateCursorPosition, 0);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          terminalInput.value = commandHistory[historyIndex];
          currentCommand = commandHistory[historyIndex];
          // Update cursor position after setting value
          setTimeout(updateCursorPosition, 0);
        } else {
          historyIndex = -1;
          terminalInput.value = '';
          currentCommand = '';
          setTimeout(updateCursorPosition, 0);
        }
      }
    } else if (e.key === 'Tab') {
      // Tab always triggers autocomplete
      // Shift+Tab allows normal tab navigation to escape the input (go backwards)
      if (e.shiftKey) {
        // Allow normal tab navigation when Shift is pressed
        // Don't prevent default - let browser handle reverse tab navigation
      } else {
        // Tab without modifier: always use for autocomplete
        e.preventDefault();
        handleTabCompletion(currentCommand);
      }
    }
  }

  // Handle input changes
  function handleInput(e) {
    currentCommand = e.target.value;
    updateCursorPosition();
  }
  
  // Update cursor position based on input text and selection
  function updateCursorPosition() {
    if (!terminalInput || !terminalCursor) return;
    
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = window.getComputedStyle(terminalInput).font;
    tempSpan.style.fontFamily = window.getComputedStyle(terminalInput).fontFamily;
    tempSpan.style.fontSize = window.getComputedStyle(terminalInput).fontSize;
    tempSpan.style.fontWeight = window.getComputedStyle(terminalInput).fontWeight;
    tempSpan.style.letterSpacing = window.getComputedStyle(terminalInput).letterSpacing;
    
    // Get text up to cursor position
    const cursorPos = terminalInput.selectionStart || terminalInput.value.length;
    const textBeforeCursor = terminalInput.value.substring(0, cursorPos);
    tempSpan.textContent = textBeforeCursor;
    
    // Append to input line to measure
    const inputLine = terminalInput.closest('.terminal-input-line');
    if (inputLine) {
      inputLine.appendChild(tempSpan);
      const textWidth = tempSpan.offsetWidth;
      inputLine.removeChild(tempSpan);
      
      // Get prompt width
      const prompt = inputLine.querySelector('.prompt');
      const promptWidth = prompt ? prompt.offsetWidth + parseInt(window.getComputedStyle(prompt).marginRight) : 0;
      
      // Position cursor
      terminalCursor.style.left = (promptWidth + textWidth) + 'px';
    }
  }

  // Handle tab completion
  function handleTabCompletion(input) {
    const parts = input.trim().split(' ');
    const command = parts[0].toLowerCase();
    
    if (parts.length === 1) {
      // Command completion
      const matches = commands.filter(cmd => 
        cmd.name.toLowerCase().startsWith(command)
      );
      if (matches.length === 1) {
        terminalInput.value = matches[0].name + (parts[0] ? ' ' : '');
        currentCommand = terminalInput.value;
        updateCursorPosition();
      } else if (matches.length > 1) {
        addOutput('Possible commands: ' + matches.map(m => m.name).join(', '), 'terminal-info');
      }
    } else if (command === 'cat' || command === 'read') {
      // File/post name completion
      const partial = parts.slice(1).join(' ').toLowerCase();
      
      // If no partial input, show all posts
      if (partial === '') {
        if (blogPosts.length > 0) {
          addOutput('Available posts:', 'terminal-info');
          blogPosts.forEach(post => {
            addOutput(`  ${post.slug}`, 'terminal-info');
          });
        } else {
          addOutput('No posts available.', 'terminal-info');
        }
        return;
      }
      
      const matches = blogPosts.filter(post => 
        post.slug.toLowerCase().startsWith(partial) ||
        post.title.toLowerCase().startsWith(partial)
      );
      if (matches.length === 1) {
        terminalInput.value = command + ' ' + matches[0].slug;
        currentCommand = terminalInput.value;
        updateCursorPosition();
      } else if (matches.length > 1) {
        addOutput('Possible posts: ' + matches.map(m => m.slug).join(', '), 'terminal-info');
      }
    }
  }

  // Execute command
  function executeCommand(input) {
    if (!input || !input.trim()) {
      // Don't add anything when input is empty
      return;
    }

    // Reset blog content flag for new commands (unless it's cat/read)
    const parts = input.split(' ');
    const commandName = parts[0].toLowerCase();
    if (commandName !== 'cat' && commandName !== 'read') {
      isDisplayingBlogContent = false;
      window.isDisplayingBlogContent = false;
      // Remove reading progress bar when switching to non-blog commands
      removeReadingProgressBar();
    }

    // Add to history
    if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== input) {
      commandHistory.push(input);
    }

    // Show command
    addPrompt(input);

    // Parse command
    const args = parts.slice(1);

    // Find and execute command
    const command = commands.find(cmd => 
      cmd.name.toLowerCase() === commandName || 
      (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === commandName))
    );

    if (command) {
      try {
        command.execute(args);
      } catch (error) {
        addOutput(`Error executing command: ${error.message}`, 'terminal-error');
      }
    } else {
      addOutput(`Command not found: '${commandName}'. Type 'help' for available commands.`, 'terminal-error');
    }
  }

  // Add output to terminal
  function addOutput(text, className = 'terminal-output-text') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:420',message:'addOutput called',data:{textLength:text?.length,textPreview:text?.substring(0,50),className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const outputEl = terminalOutput || window.terminalOutput;
    if (!outputEl) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    outputEl.appendChild(line);
    
    // #region agent log
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(line);
      const rect = line.getBoundingClientRect();
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:432',message:'After appending line element',data:{className:line.className,marginTop:computedStyle.marginTop,marginBottom:computedStyle.marginBottom,minHeight:computedStyle.minHeight,lineHeight:computedStyle.lineHeight,height:computedStyle.height,rectHeight:rect.height,rectTop:rect.top,whiteSpace:computedStyle.whiteSpace},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    }, 10);
    // #endregion
    
    // Only scroll if not displaying blog content
    if (!isDisplayingBlogContent && !window.isDisplayingBlogContent) {
      scrollToBottom();
    }
  }

  // Add section title (in-content headings only; no back arrow)
  function addSectionTitle(text) {
    addOutput(text, 'terminal-section-title');
  }

  // Add HTML output to terminal (for formatted content)
  function addHTMLOutput(html, className = 'terminal-output-text') {
    const outputEl = terminalOutput || window.terminalOutput;
    if (!outputEl) return;
    
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = html;
    outputEl.appendChild(line);
    scrollToBottom();
  }

  // Convert HTML to terminal-friendly text with image placeholders
  function convertHTMLToTerminalText(htmlString, baseUrl = '') {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // Find the main content area (usually in .post-content, .entry-content, or .wrapper)
    let content = tempDiv.querySelector('.post-content') || 
                  tempDiv.querySelector('.entry-content') || 
                  tempDiv.querySelector('article') ||
                  tempDiv.querySelector('main') ||
                  tempDiv.querySelector('.page-content') ||
                  tempDiv;

    // If we found a specific content area, use it; otherwise use the whole div
    const contentEl = content === tempDiv ? content : content;

    return convertElementToTerminalText(contentEl, baseUrl);
  }

  // Recursively convert DOM element to terminal-friendly text
  function convertElementToTerminalText(element, baseUrl = '') {
    const result = [];

    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          result.push({ type: 'text', content: text });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Handle images
        if (tagName === 'img') {
          let alt = node.getAttribute('alt') || 'Image';
          let src = node.getAttribute('src') || '';
          // Convert relative URLs to absolute
          if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
            if (baseUrl) {
              // Resolve relative to post URL
              const urlObj = new URL(baseUrl, window.location.href);
              if (src.startsWith('/')) {
                src = urlObj.origin + src;
              } else {
                const postPath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
                src = new URL(src, urlObj.origin + postPath).href;
              }
            } else {
              // Fallback to current page
              if (src.startsWith('/')) {
                src = window.location.origin + src;
              } else {
                const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                src = window.location.origin + currentPath + src;
              }
            }
          }
          
          // Special handling for about page: replace "My helpful screenshot" with heading caption
          if (alt === 'My helpful screenshot' && baseUrl === '/about/') {
            // Look for the next heading (h5 or h6) that contains "me with various gourds, 2022"
            let nextSibling = node.nextSibling;
            while (nextSibling) {
              if (nextSibling.nodeType === Node.ELEMENT_NODE) {
                const siblingTag = nextSibling.tagName.toLowerCase();
                if (['h5', 'h6'].includes(siblingTag)) {
                  const headingText = nextSibling.textContent.trim();
                  if (headingText.includes('me with various gourds')) {
                    alt = headingText;
                    break;
                  }
                }
              }
              nextSibling = nextSibling.nextSibling;
            }
            // Also check parent's next sibling if not found
            if (alt === 'My helpful screenshot' && node.parentElement) {
              let parentSibling = node.parentElement.nextSibling;
              while (parentSibling) {
                if (parentSibling.nodeType === Node.ELEMENT_NODE) {
                  const heading = parentSibling.querySelector('h5, h6');
                  if (heading) {
                    const headingText = heading.textContent.trim();
                    if (headingText.includes('me with various gourds')) {
                      alt = headingText;
                      break;
                    }
                  }
                }
                parentSibling = parentSibling.nextSibling;
              }
            }
          }
          
          result.push({ type: 'image', alt, src });
        }
        // Handle headings
        else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          const text = node.textContent.trim();
          if (text) {
            result.push({ type: 'heading', level: parseInt(tagName.charAt(1)), content: text });
          }
        }
        // Handle code blocks
        else if (tagName === 'pre' || tagName === 'code') {
          const text = node.textContent;
          result.push({ type: 'code', content: text, isBlock: tagName === 'pre' });
        }
        // Handle lists
        else if (tagName === 'ul' || tagName === 'ol') {
          const items = Array.from(node.querySelectorAll('li')).map(li => li.textContent.trim());
          result.push({ type: 'list', items, ordered: tagName === 'ol' });
        }
        // Handle blockquotes
        else if (tagName === 'blockquote') {
          const text = node.textContent.trim();
          if (text) {
            result.push({ type: 'blockquote', content: text });
          }
        }
        // Handle line breaks
        else if (tagName === 'br') {
          result.push({ type: 'linebreak' });
        }
        // Handle paragraphs - recursively process children to find images, links, etc.
        else if (tagName === 'p') {
          const nested = convertElementToTerminalText(node, baseUrl);
          if (nested.length > 0) {
            result.push(...nested);
          } else {
            // If no nested content found, just use text as fallback
            const text = node.textContent.trim();
            if (text) {
              result.push({ type: 'paragraph', content: text });
            }
          }
        }
        // Handle links
        else if (tagName === 'a') {
          const text = node.textContent.trim();
          let href = node.getAttribute('href') || '';
          // Convert relative URLs to absolute
          if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('#')) {
            if (baseUrl) {
              // Resolve relative to post URL
              try {
                href = new URL(href, new URL(baseUrl, window.location.href)).href;
              } catch (e) {
                // If URL parsing fails, keep original
              }
            } else {
              // Fallback to current page
              try {
                href = new URL(href, window.location.href).href;
              } catch (e) {
                // If URL parsing fails, keep original
              }
            }
          }
          result.push({ type: 'link', text, href });
        }
        // Handle horizontal rules
        else if (tagName === 'hr') {
          result.push({ type: 'hr' });
        }
        // Recursively process other elements
        else {
          const nested = convertElementToTerminalText(node, baseUrl);
          result.push(...nested);
        }
      }
    }

    return result;
  }

  // Render terminal-friendly content to the terminal
  function renderTerminalContent(content) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:630',message:'renderTerminalContent called',data:{contentLength:content.length,contentTypes:content.map(c=>c.type)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    for (const item of content) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:632',message:'Rendering content item',data:{type:item.type,contentPreview:item.content?.substring(0,50)||item.alt||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      switch (item.type) {
        case 'text':
        case 'paragraph':
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:635',message:'Before addOutput paragraph',data:{contentLength:item.content?.length,contentPreview:item.content?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          addOutput(item.content);
          // #region agent log
          setTimeout(() => {
            const outputEl = terminalOutput || window.terminalOutput;
            const lastLine = outputEl?.lastElementChild;
            const computedStyle = lastLine ? window.getComputedStyle(lastLine) : null;
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:637',message:'After addOutput paragraph',data:{hasLastLine:!!lastLine,lastLineClasses:lastLine?.className,marginTop:computedStyle?.marginTop,marginBottom:computedStyle?.marginBottom,minHeight:computedStyle?.minHeight,lineHeight:computedStyle?.lineHeight,height:computedStyle?.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          }, 10);
          // #endregion
          break;
        case 'heading':
          const levelMarkers = { 1: '=', 2: '-', 3: '~' };
          const marker = levelMarkers[item.level] || '-';
          addSectionTitle(item.content);
          addOutput(marker.repeat(Math.min(item.content.length, 60)));
          break;
        case 'code':
          if (item.isBlock) {
            addOutput('');
            const codeLines = item.content.split('\n');
            codeLines.forEach(line => {
              addOutput(`  ${line}`, 'terminal-code');
            });
            addOutput('');
          } else {
            addOutput(`\`${item.content}\``, 'terminal-code');
          }
          break;
        case 'list':
          addOutput('');
          item.items.forEach((itemText, index) => {
            const prefix = item.ordered ? `${index + 1}.` : '•';
            addOutput(`  ${prefix} ${itemText}`);
          });
          addOutput('');
          break;
        case 'blockquote':
          addOutput(`> ${item.content}`, 'terminal-info');
          break;
        case 'linebreak':
          addOutput('');
          break;
        case 'hr':
          addOutput('─'.repeat(60), 'terminal-info');
          break;
        case 'image':
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:672',message:'Before creating image element',data:{hasSrc:!!item.src,alt:item.alt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          const imageLine = document.createElement('div');
          imageLine.className = 'terminal-line terminal-image-container';
          if (item.src) {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt || 'Image';
            img.className = 'terminal-image';
            img.onerror = function() {
              // Fallback to text if image fails to load
              imageLine.innerHTML = '';
              imageLine.className = 'terminal-line terminal-output-text';
              const imageText = `[Image: ${item.alt || 'Image'}]`;
              imageLine.appendChild(document.createTextNode(imageText));
              const link = document.createElement('a');
              link.href = item.src;
              link.className = 'terminal-post-link';
              link.textContent = ' (View)';
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              imageLine.appendChild(link);
            };
            imageLine.appendChild(img);
            if (item.alt) {
              const altText = document.createElement('div');
              altText.className = 'terminal-image-alt';
              altText.textContent = item.alt;
              imageLine.appendChild(altText);
            }
          } else {
            imageLine.textContent = `[Image: ${item.alt || 'Image'}]`;
          }
          const outputEl = terminalOutput || window.terminalOutput;
          if (outputEl) {
            outputEl.appendChild(imageLine);
            // #region agent log
            setTimeout(() => {
              const computedStyle = window.getComputedStyle(imageLine);
              const imgEl = imageLine.querySelector('img');
              const imgStyle = imgEl ? window.getComputedStyle(imgEl) : null;
              fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:707',message:'After appending image element',data:{imageLineMarginTop:computedStyle.marginTop,imageLineMarginBottom:computedStyle.marginBottom,imageLineMinHeight:computedStyle.minHeight,imageLineHeight:computedStyle.height,imgHeight:imgStyle?.height,imgMaxHeight:imgStyle?.maxHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            }, 10);
            // #endregion
          }
          // Don't autoscroll when displaying blog content
          if (!isDisplayingBlogContent && !window.isDisplayingBlogContent) {
            scrollToBottom();
          }
          break;
        case 'link':
          const linkLine = document.createElement('div');
          linkLine.className = 'terminal-line terminal-output-text';
          linkLine.appendChild(document.createTextNode(item.text));
          if (item.href) {
            const link = document.createElement('a');
            link.href = item.href;
            link.className = 'terminal-post-link';
            link.textContent = ` [${item.href}]`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            linkLine.appendChild(link);
          }
          const outputElLink = terminalOutput || window.terminalOutput;
          if (outputElLink) {
            outputElLink.appendChild(linkLine);
          }
          // Don't autoscroll when displaying blog content
          if (!isDisplayingBlogContent && !window.isDisplayingBlogContent) {
            scrollToBottom();
          }
          break;
      }
    }
  }

  // Add prompt line
  function addPrompt(command) {
    const outputEl = terminalOutput || window.terminalOutput;
    if (!outputEl) return;
    
    const line = document.createElement('div');
    line.className = 'terminal-line terminal-command';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = '$';
    line.appendChild(prompt);
    line.appendChild(document.createTextNode(' ' + command));
    outputEl.appendChild(line);
    scrollToBottom();
  }

  // Scroll to bottom
  function scrollToBottom() {
    // Skip autoscroll when displaying blog content
    if (isDisplayingBlogContent || window.isDisplayingBlogContent) {
      return;
    }
    const outputEl = terminalOutput || window.terminalOutput;
    if (outputEl) {
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }

  // Scroll to title when displaying blog content
  function scrollToTitle() {
    const outputEl = terminalOutput || window.terminalOutput;
    if (!outputEl) return;
    
    // Find the title container
    const titleContainer = outputEl.querySelector('.terminal-title-sticky');
    if (titleContainer) {
      // Scroll to the title position
      titleContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If no title, scroll to top
      outputEl.scrollTop = 0;
    }
  }

  // Reading progress bar functions
  let progressBarScrollListener = null;
  let progressBarOutputEl = null;

  function createReadingProgressBar(outputEl = null) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:787',message:'createReadingProgressBar called',data:{hasOutputEl:!!outputEl,outputElTag:outputEl?.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const targetEl = outputEl || terminalOutput || window.terminalOutput;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:789',message:'targetEl resolved',data:{hasTargetEl:!!targetEl,targetElTag:targetEl?.tagName,targetElId:targetEl?.id,targetElClassName:targetEl?.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!targetEl) return;

    // Store reference to output element
    progressBarOutputEl = targetEl;

    // Remove existing progress bar if any
    removeReadingProgressBar();

    // Create progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'terminal-reading-progress';
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'terminal-reading-progress-bar';
    
    progressContainer.appendChild(progressBar);
    
    // Add class to hide native scrollbar when progress bar is active
    targetEl.classList.add('has-progress-bar');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:808',message:'Before DOM insertion',data:{containerClassName:progressContainer.className,barClassName:progressBar.className,targetElFirstChild:targetEl.firstChild?.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Insert progress bar after the title container (if it exists), otherwise at the beginning
    const titleContainer = targetEl.querySelector('.terminal-title-sticky');
    if (titleContainer) {
      // Insert right after the title container
      if (titleContainer.nextSibling) {
        targetEl.insertBefore(progressContainer, titleContainer.nextSibling);
      } else {
        // Title is the last child, append after it
        targetEl.appendChild(progressContainer);
      }
      
      // Calculate title height and set progress bar to stick below it
      // Use setTimeout to ensure title is fully rendered
      setTimeout(() => {
        const titleHeight = titleContainer.offsetHeight;
        progressContainer.style.top = `${titleHeight}px`;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:832',message:'Progress bar positioned below title',data:{titleHeight,progressBarTop:progressContainer.style.top},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }, 100);
    } else {
      // No title container, insert at the beginning and stick to top
      targetEl.insertBefore(progressContainer, targetEl.firstChild);
      progressContainer.style.top = '0px';
    }
    
    // #region agent log
    const insertedEl = targetEl.querySelector('.terminal-reading-progress');
    const computedStyle = insertedEl ? window.getComputedStyle(insertedEl) : null;
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:845',message:'After DOM insertion',data:{inserted:!!insertedEl,isFirstChild:insertedEl===targetEl.firstChild,position:computedStyle?.position,top:computedStyle?.top,zIndex:computedStyle?.zIndex,width:computedStyle?.width,height:computedStyle?.height,minHeight:computedStyle?.minHeight,flexShrink:computedStyle?.flexShrink,display:computedStyle?.display,visibility:computedStyle?.visibility,opacity:computedStyle?.opacity},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }

  function updateReadingProgress() {
    const outputEl = progressBarOutputEl || terminalOutput || window.terminalOutput;
    if (!outputEl) return;

    const progressBar = outputEl.querySelector('.terminal-reading-progress-bar');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:811',message:'updateReadingProgress called',data:{hasProgressBar:!!progressBar,currentWidth:progressBar?.style?.width},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!progressBar) return;

    const scrollTop = outputEl.scrollTop;
    const scrollHeight = outputEl.scrollHeight;
    const clientHeight = outputEl.clientHeight;
    
    if (scrollHeight <= clientHeight) {
      progressBar.style.width = '100%';
      return;
    }

    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const newWidth = Math.min(100, Math.max(0, scrollPercentage)) + '%';
    progressBar.style.width = newWidth;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:829',message:'Progress bar width updated',data:{newWidth,scrollTop,scrollHeight,clientHeight,scrollPercentage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }

  function setupReadingProgressListener(outputEl = null) {
    const targetEl = outputEl || terminalOutput || window.terminalOutput;
    if (!targetEl) return;

    // Store reference to output element
    progressBarOutputEl = targetEl;

    // Remove existing listener if any
    if (progressBarScrollListener && progressBarOutputEl) {
      progressBarOutputEl.removeEventListener('scroll', progressBarScrollListener);
    }

    // Create new listener
    progressBarScrollListener = updateReadingProgress;
    targetEl.addEventListener('scroll', progressBarScrollListener);
    
    // Initial update
    updateReadingProgress();
  }

  function removeReadingProgressBar() {
    const outputEl = progressBarOutputEl || terminalOutput || window.terminalOutput;
    if (!outputEl) return;

    // Remove progress bar element
    const progressContainer = outputEl.querySelector('.terminal-reading-progress');
    if (progressContainer) {
      progressContainer.remove();
    }

    // Remove class to show native scrollbar again
    outputEl.classList.remove('has-progress-bar');

    // Remove scroll listener
    if (progressBarScrollListener && outputEl) {
      outputEl.removeEventListener('scroll', progressBarScrollListener);
      progressBarScrollListener = null;
    }

    // Clear reference
    progressBarOutputEl = null;
  }

  // Command definitions
  const commands = [
    {
      name: 'help',
      description: 'Show available commands',
      execute: () => {
        addOutput('Available commands:', 'terminal-info');
        addOutput('');
        commands.forEach(cmd => {
          const aliases = cmd.aliases ? ` (aliases: ${cmd.aliases.join(', ')})` : '';
          const line = document.createElement('div');
          line.className = 'terminal-line terminal-help-item';
          const cmdSpan = document.createElement('span');
          cmdSpan.className = 'terminal-help-command';
          cmdSpan.textContent = `  ${cmd.name}${aliases}`;
          line.appendChild(cmdSpan);
          const descSpan = document.createElement('span');
          descSpan.className = 'terminal-help-description';
          descSpan.textContent = `  ${cmd.description}`;
          line.appendChild(descSpan);
          terminalOutput.appendChild(line);
        });
        scrollToBottom();
      }
    },
    {
      name: 'clear',
      description: 'Clear the terminal',
      execute: () => {
        // Reset blog content flag
        isDisplayingBlogContent = false;
        window.isDisplayingBlogContent = false;
        // Remove reading progress bar
        removeReadingProgressBar();
        terminalOutput.innerHTML = '';
        showWelcomeMessage();
      }
    },
    {
      name: 'ls',
      aliases: ['list'],
      description: 'List blog posts',
      execute: () => {
        // Try to parse posts if empty
        if (blogPosts.length === 0) {
          // Try to fetch posts from home page if not available
          if (!window.jekyllPosts || !Array.isArray(window.jekyllPosts) || window.jekyllPosts.length === 0) {
            fetch('/')
              .then(response => response.text())
              .then(html => {
                // Extract window.jekyllPosts from home page - look for the full script block
                // The Liquid template generates JavaScript object literals, not JSON, so we need to execute it
                const scriptMatch = html.match(/window\.jekyllPosts\s*=\s*(\[[\s\S]*?\]);/);
                if (scriptMatch && scriptMatch[1]) {
                  try {
                    // Execute the JavaScript code to get the array (it's JS object literal syntax, not JSON)
                    // Use Function constructor to safely execute the code
                    const getPosts = new Function('return ' + scriptMatch[1]);
                    window.jekyllPosts = getPosts();
                    parsePostsFromPage();
                    // Retry ls command output
                    if (blogPosts.length > 0) {
                      addOutput('Posts:', 'terminal-info');
                      blogPosts.forEach(post => {
                        const line = document.createElement('div');
                        line.className = 'terminal-line terminal-post-item';
                        const slug = post.slug || 'untitled';
                        const dateStr = post.date ? `  [${post.date}]` : '';
                        line.textContent = `  ${slug}${dateStr}`;
                        if (post.url) {
                          const link = document.createElement('a');
                          link.href = post.url;
                          link.className = 'terminal-post-link';
                          link.textContent = slug;
                          link.style.marginRight = '10px';
                          line.innerHTML = '';
                          line.appendChild(document.createTextNode('  '));
                          line.appendChild(link);
                          if (dateStr) {
                            line.appendChild(document.createTextNode(dateStr));
                          }
                        }
                        const outputEl = terminalOutput || window.terminalOutput;
                        if (outputEl) {
                          outputEl.appendChild(line);
                        }
                      });
                      scrollToBottom();
                    } else {
                      addOutput('No posts found.', 'terminal-info');
                    }
                  } catch (e) {
                    addOutput('No posts found.', 'terminal-info');
                  }
                } else {
                  addOutput('No posts found.', 'terminal-info');
                }
              })
              .catch(() => {
                addOutput('No posts found.', 'terminal-info');
              });
            return;
          } else {
            parsePostsFromPage();
          }
        }
        
        if (blogPosts.length === 0) {
          addOutput('No posts found.', 'terminal-info');
          return;
        }
        addOutput('Posts:', 'terminal-info');
        blogPosts.forEach(post => {
          const line = document.createElement('div');
          line.className = 'terminal-line terminal-post-item';
          const slug = post.slug || 'untitled';
          const dateStr = post.date ? `  [${post.date}]` : '';
          line.textContent = `  ${slug}${dateStr}`;
          if (post.url) {
            const link = document.createElement('a');
            link.href = post.url;
            link.className = 'terminal-post-link';
            link.textContent = slug;
            link.style.marginRight = '10px';
            line.innerHTML = '';
            line.appendChild(document.createTextNode('  '));
            line.appendChild(link);
            if (dateStr) {
              line.appendChild(document.createTextNode(dateStr));
            }
          }
          terminalOutput.appendChild(line);
        });
        scrollToBottom();
      }
    },
    {
      name: 'cat',
      aliases: ['read'],
      description: 'Display post content. Usage: cat <blog-title>',
      execute: (args) => {
        // Check if args are empty or just whitespace
        const input = args.join(' ').trim();
        if (input === '') {
          // Show all available posts (similar to tab completion behavior)
          if (blogPosts.length > 0) {
            addOutput('Available posts:', 'terminal-info');
            blogPosts.forEach(post => {
              addOutput(`  ${post.slug}`, 'terminal-info');
            });
          } else {
            addOutput('No posts available.', 'terminal-info');
            addOutput('Type "ls" to see available posts.', 'terminal-info');
          }
          return;
        }
        const slug = input.toLowerCase();
        const post = blogPosts.find(p => 
          p.slug.toLowerCase() === slug || 
          p.title.toLowerCase() === slug
        );
        if (post) {
          // Clear previous output before displaying blog post
          // Remove progress bar and clean up listeners first
          removeReadingProgressBar();
          const outputElCat = terminalOutput || window.terminalOutput;
          if (outputElCat) {
            outputElCat.innerHTML = '';
          }
          
          // Fetch and display full post content
          if (post.url) {
            fetch(post.url)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to fetch post');
                }
                return response.text();
              })
              .then(html => {
                const outputElCat = terminalOutput || window.terminalOutput;
                
                // Create and insert sticky ASCII art title
                if (post.title) {
                  const titleContainer = document.createElement('div');
                  titleContainer.className = 'terminal-title-sticky';
                  
                  // Add back arrow to container (not to ASCII art lines)
                  const backArrow = document.createElement('span');
                  backArrow.className = 'terminal-back-arrow terminal-back-arrow-absolute';
                  backArrow.textContent = '←';
                  backArrow.setAttribute('aria-label', 'Go back to home');
                  backArrow.setAttribute('role', 'button');
                  backArrow.setAttribute('tabindex', '0');
                  backArrow.addEventListener('click', resetTerminal);
                  backArrow.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      resetTerminal();
                    }
                  });
                  titleContainer.appendChild(backArrow);
                  
                  const asciiTitle = generateASCIIArt(post.title);
                  const titleLines = asciiTitle.split('\n');
                  titleLines.forEach((line) => {
                    const titleLine = document.createElement('div');
                    titleLine.className = 'terminal-line terminal-section-title terminal-section-title-ascii';
                    const lineText = document.createElement('span');
                    lineText.textContent = line;
                    titleLine.appendChild(lineText);
                    titleContainer.appendChild(titleLine);
                  });
                  
                  // Insert title at the current position (before content)
                  outputElCat.appendChild(titleContainer);
                  
                  // Add date if available
                  if (post.date) {
                    addOutput(`Date: ${post.date}`, 'terminal-info');
                  }
                  addOutput('');
                }
                
                // Set flag to disable autoscroll
                isDisplayingBlogContent = true;
                window.isDisplayingBlogContent = true;
                
                // Create reading progress bar
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:1100',message:'About to call createReadingProgressBar',data:{terminalOutputExists:!!terminalOutput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                createReadingProgressBar();
                // #region agent log
                setTimeout(() => {
                  const checkEl = terminalOutput?.querySelector('.terminal-reading-progress');
                  fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:1105',message:'After createReadingProgressBar call',data:{progressBarExists:!!checkEl,isInDOM:checkEl?.parentNode===terminalOutput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                }, 50);
                // #endregion
                
                // Parse and display content
                const terminalContent = convertHTMLToTerminalText(html, post.url);
                
                // Add fade-in animation to content
                if (outputElCat) {
                  outputElCat.style.opacity = '0';
                  outputElCat.style.transition = 'opacity 0.3s ease-in';
                }
                
                renderTerminalContent(terminalContent);
                
                // Fade in the content
                requestAnimationFrame(() => {
                  if (outputElCat) {
                    outputElCat.style.opacity = '1';
                  }
                });
                
                // Setup scroll listener for progress bar and scroll to title
                setTimeout(() => {
                  // #region agent log
                  const checkEl2 = terminalOutput?.querySelector('.terminal-reading-progress');
                  fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:1115',message:'In setTimeout before setupReadingProgressListener',data:{progressBarExists:!!checkEl2,contentRendered:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                  setupReadingProgressListener();
                  scrollToTitle();
                }, 100);
                
                // Update URL to make it shareable without reloading
                let postPath = post.url;
                if (postPath.startsWith('/')) {
                  postPath = postPath.substring(1);
                }
                postPath = postPath.replace(/\.html$/, '');
                const terminalUrl = '/terminal/' + postPath;
                
                // Update URL using History API (no page reload)
                if (window.history && window.history.pushState) {
                  window.history.pushState({ post: post.title }, post.title, terminalUrl);
                }
                
                // Show shareable link message
                addOutput('');
                const shareLine = document.createElement('div');
                shareLine.className = 'terminal-line terminal-info';
                shareLine.appendChild(document.createTextNode('Shareable link: '));
                const shareLink = document.createElement('a');
                shareLink.href = terminalUrl;
                shareLink.className = 'terminal-post-link';
                shareLink.textContent = window.location.origin + terminalUrl;
                shareLink.target = '_blank';
                shareLink.rel = 'noopener noreferrer';
                shareLine.appendChild(shareLink);
                const outputElShare = terminalOutput || window.terminalOutput;
                if (outputElShare) {
                  outputElShare.appendChild(shareLine);
                  // Don't autoscroll when displaying blog content
                  // scrollToBottom();
                }
              })
              .catch(error => {
                // Remove the loading message
                const outputElError = terminalOutput || window.terminalOutput;
                if (outputElError) {
                  const lastLine = outputElError.lastElementChild;
                  if (lastLine && lastLine.textContent.includes('Loading post content...')) {
                    outputElError.removeChild(lastLine);
                  }
                }
                
                // Fallback to excerpt if fetch fails
                addOutput(`Error loading full post: ${error.message}`, 'terminal-error');
                if (post.excerpt) {
                  addOutput('');
                  addOutput('Showing excerpt:', 'terminal-info');
                  addOutput(post.excerpt);
                }
                addOutput('');
                // Create shareable link with terminal URL (even on error, URL is still updated)
                let postPathError = post.url;
                if (postPathError.startsWith('/')) {
                  postPathError = postPathError.substring(1);
                }
                postPathError = postPathError.replace(/\.html$/, '');
                const terminalUrlError = '/terminal/' + postPathError;
                
                // Update URL even on error so it's still shareable
                if (window.history && window.history.pushState) {
                  window.history.pushState({ post: post.title }, post.title, terminalUrlError);
                }
                
                const linkLine = document.createElement('div');
                linkLine.className = 'terminal-line terminal-info';
                linkLine.appendChild(document.createTextNode('Shareable link: '));
                const link = document.createElement('a');
                link.href = terminalUrlError;
                link.className = 'terminal-post-link';
                link.textContent = window.location.origin + terminalUrlError;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                linkLine.appendChild(link);
                const outputElLink = terminalOutput || window.terminalOutput;
                if (outputElLink) {
                  outputElLink.appendChild(linkLine);
                  // Don't autoscroll when displaying blog content
                  // scrollToBottom();
                }
              });
          } else {
            // Fallback if no URL
            if (post.excerpt) {
              addOutput(post.excerpt);
            }
          }
        } else {
          addOutput(`Post not found: '${slug}'`, 'terminal-error');
          addOutput('Type "ls" to see available posts.', 'terminal-info');
        }
      }
    },
    {
      name: 'whoami',
      description: 'Show information about the author',
      execute: () => {
        addOutput('Loading about information...', 'terminal-info');
        fetch('/about/')
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch about page');
            }
            return response.text();
          })
          .then(html => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:whoami',message:'whoami fetch OK, about to render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'verify'})}).catch(()=>{});
            // #endregion
            // Remove the loading message
            const lastLine = terminalOutput.lastElementChild;
            if (lastLine && lastLine.textContent.includes('Loading about information...')) {
              terminalOutput.removeChild(lastLine);
            }
            
            // Parse and display content
            const terminalContent = convertHTMLToTerminalText(html, '/about/');
            renderTerminalContent(terminalContent);
          })
          .catch(error => {
            // Remove the loading message
            const lastLine = terminalOutput.lastElementChild;
            if (lastLine && lastLine.textContent.includes('Loading about information...')) {
              terminalOutput.removeChild(lastLine);
            }
            
            // Fallback message
            addOutput(`Error loading about page: ${error.message}`, 'terminal-error');
            addOutput('Ashaun', 'terminal-success');
            addOutput('Software engineer, blogger, Muay Thai enthusiast', 'terminal-info');
          });
      }
    },
    {
      name: 'contact',
      description: 'Show contact information',
      execute: () => {
        // Email with mailto link
        const emailLine = document.createElement('div');
        emailLine.className = 'terminal-line terminal-info';
        emailLine.appendChild(document.createTextNode('Email: '));
        const emailLink = document.createElement('a');
        emailLink.href = 'mailto:ashaunthomas@outlook.com';
        emailLink.className = 'terminal-post-link';
        emailLink.textContent = 'ashaunthomas@outlook.com';
        emailLine.appendChild(emailLink);
        const outputElEmail = terminalOutput || window.terminalOutput;
        if (outputElEmail) {
          outputElEmail.appendChild(emailLine);
        }
        
        // GitHub with link
        const githubLine = document.createElement('div');
        githubLine.className = 'terminal-line terminal-info';
        githubLine.appendChild(document.createTextNode('GitHub: '));
        const githubLink = document.createElement('a');
        githubLink.href = 'https://github.com/lasagnamassage';
        githubLink.className = 'terminal-post-link';
        githubLink.textContent = '@lasagnamassage';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLine.appendChild(githubLink);
        const outputElGitHub = terminalOutput || window.terminalOutput;
        if (outputElGitHub) {
          outputElGitHub.appendChild(githubLine);
        }
        
        scrollToBottom();
      }
    }
  ];

  // Mode toggle functionality
  function initModeToggle() {
    // Get both buttons - one in nav, one fixed
    const toggleButtonNav = document.getElementById('modeToggle');
    const toggleButtonFixed = document.getElementById('modeToggleFixed');
    const toggleButton = toggleButtonNav || toggleButtonFixed;
    const simpleMode = document.getElementById('simpleMode');
    const body = document.body;
    
    // Check if we're on a 404 page - don't initialize toggle
    const is404Page = window.location.pathname === '/404.html' || 
                      document.querySelector('h1')?.textContent?.trim() === '404' ||
                      document.body.querySelector('.container h1')?.textContent?.trim() === '404';
    
    // Check if we're on a terminal URL - button should already be set up by handlePostRouting
    const isTerminalUrl = window.location.pathname.match(/^\/terminal\//);
    
    if (is404Page || (!toggleButton && !isTerminalUrl)) {
      return;
    }
    
    // If on terminal URL and button already exists, don't override it
    if (isTerminalUrl && toggleButtonFixed && toggleButtonFixed.onclick) {
      return;
    }
    
    // If we're on a blog post page (not home), set up navigation to terminal view
    const isPostPage = document.querySelector('.post-content') !== null && !simpleMode;
    if (isPostPage) {
      // Get post URL from current page
      const currentPath = window.location.pathname;
      let postPath = currentPath;
      if (postPath.startsWith('/')) {
        postPath = postPath.substring(1);
      }
      if (postPath.endsWith('.html')) {
        postPath = postPath.replace(/\.html$/, '');
      }
      const terminalUrl = '/terminal/' + postPath;
      
      if (toggleButtonNav) {
        toggleButtonNav.textContent = 'Switch to Terminal View';
        toggleButtonNav.setAttribute('aria-label', 'Switch to terminal interface');
        toggleButtonNav.onclick = () => {
          window.location.href = terminalUrl;
        };
      }
      if (toggleButtonFixed) {
        toggleButtonFixed.textContent = 'Switch to Terminal View';
        toggleButtonFixed.setAttribute('aria-label', 'Switch to terminal interface');
        toggleButtonFixed.onclick = () => {
          window.location.href = terminalUrl;
        };
      }
      return;
    }
    
    // Home page mode toggle (requires simpleMode)
    if (!simpleMode) {
      return;
    }

    function switchToSimpleMode() {
      // Directly set display property instead of relying on CSS classes
      simpleMode.style.display = 'block';
      simpleMode.classList.add('active');
      body.classList.remove('terminal-mode');
      body.classList.add('simple-mode');
      
      // #region agent log
      setTimeout(() => {
        const simpleHeader = simpleMode.querySelector('.site-header');
        const simpleWrapper = simpleHeader?.querySelector('.wrapper');
        const simpleTitle = simpleMode.querySelector('.site-title');
        const simpleLink = simpleMode.querySelector('.page-link');
        if (simpleHeader && simpleTitle) {
          const headerStyles = window.getComputedStyle(simpleHeader);
          const headerRect = simpleHeader.getBoundingClientRect();
          const wrapperStyles = simpleWrapper ? window.getComputedStyle(simpleWrapper) : null;
          const wrapperRect = simpleWrapper ? simpleWrapper.getBoundingClientRect() : null;
          const titleStyles = window.getComputedStyle(simpleTitle);
          const linkStyles = simpleLink ? window.getComputedStyle(simpleLink) : null;
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:1175',message:'Simple mode header positioning post-fix',data:{headerBg:headerStyles.backgroundColor,headerBorder:headerStyles.borderBottom,headerPadding:headerStyles.padding,headerMargin:headerStyles.margin,headerPosition:headerStyles.position,headerTop:headerRect.top,headerLeft:headerRect.left,headerWidth:headerRect.width,headerHeight:headerRect.height,wrapperMaxWidth:wrapperStyles?.maxWidth,wrapperWidth:wrapperRect?.width,wrapperPadding:wrapperStyles?.padding,wrapperMargin:wrapperStyles?.margin,titleColor:titleStyles.color,titleFontSize:titleStyles.fontSize,titleFontWeight:titleStyles.fontWeight,linkColor:linkStyles?.color,linkFontSize:linkStyles?.fontSize},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        }
      }, 100);
      // #endregion
      
      // Hide terminal container directly
      const terminalContainer = document.querySelector('.terminal-container');
      if (terminalContainer) {
        terminalContainer.style.display = 'none';
      }
      
      // Update both buttons
      const updateButtonText = (btn, text, label) => {
        if (btn) {
          btn.textContent = text;
          btn.setAttribute('aria-label', label);
        }
      };
      updateButtonText(toggleButtonNav, 'Switch to Terminal View', 'Switch to terminal interface');
      updateButtonText(toggleButtonFixed, 'Switch to Terminal View', 'Switch to terminal interface');
      sessionStorage.setItem('viewMode', 'simple');
    }

    function switchToTerminalMode() {
      // Directly set display property to none
      simpleMode.style.display = 'none';
      simpleMode.classList.remove('active');
      body.classList.remove('simple-mode');
      body.classList.add('terminal-mode');
      
      // Show terminal container directly
      const terminalContainer = document.querySelector('.terminal-container');
      if (terminalContainer) {
        terminalContainer.style.display = 'flex';
      }
      
      // Update both buttons
      const updateButtonText = (btn, text, label) => {
        if (btn) {
          btn.textContent = text;
          btn.setAttribute('aria-label', label);
        }
      };
      updateButtonText(toggleButtonNav, 'Switch to Simple View', 'Switch to simple layout');
      updateButtonText(toggleButtonFixed, 'Switch to Simple View', 'Switch to simple layout');
      sessionStorage.setItem('viewMode', 'terminal');
      // Refocus terminal input
      if (terminalInput) {
        terminalInput.focus();
      }
    }

    // Check for saved preference (sessionStorage - only persists for tab session)
    const savedMode = sessionStorage.getItem('viewMode');
    const isMobileOrTablet = window.matchMedia('(max-width: 1024px)').matches;

    if (isMobileOrTablet || savedMode === 'simple') {
      switchToSimpleMode();
    } else {
      // Ensure simple mode is hidden initially if not in simple mode
      simpleMode.style.display = 'none';
    }

    // Add event listeners to both buttons
    const handleToggle = () => {
      if (simpleMode.classList.contains('active')) {
        switchToTerminalMode();
      } else {
        switchToSimpleMode();
      }
    };
    
    if (toggleButtonNav) {
      toggleButtonNav.addEventListener('click', handleToggle);
    }
    if (toggleButtonFixed) {
      toggleButtonFixed.addEventListener('click', handleToggle);
    }

    // When viewport becomes mobile/tablet while in terminal mode, switch to simple mode
    const mobileQuery = window.matchMedia('(max-width: 1024px)');
    mobileQuery.addEventListener('change', (e) => {
      if (e.matches && !simpleMode.classList.contains('active')) {
        switchToSimpleMode();
      }
    });
  }

  // Simple ASCII art generator for titles
  function generateASCIIArt(text) {
    // Simple block-style ASCII art
    const lines = [];
    const upperText = text.toUpperCase();
    
    // Create a simple banner effect
    const border = '═'.repeat(Math.min(upperText.length + 4, 60));
    lines.push('╔' + border + '╗');
    lines.push('║  ' + upperText.padEnd(Math.min(upperText.length, 56)) + '  ║');
    lines.push('╚' + border + '╝');
    
    return lines.join('\n');
  }

  // URL-based routing for post pages
  function handlePostRouting() {
    const pathname = window.location.pathname;
    
    // Check if URL starts with /terminal/ or /simple/
    const terminalMatch = pathname.match(/^\/terminal\/(.+)$/);
    const simpleMatch = pathname.match(/^\/simple\/(.+)$/);
    
    if (simpleMatch) {
      // Redirect to standard post URL (without /simple/ prefix)
      const postPath = simpleMatch[1];
      window.location.replace('/' + postPath);
      return;
    }
    
    if (terminalMatch) {
      // Extract post path and create terminal view
      const postPath = terminalMatch[1];
      // Ensure the post URL has .html extension if needed (Jekyll posts usually have .html)
      let standardPostUrl = '/' + postPath;
      if (!standardPostUrl.endsWith('.html') && !standardPostUrl.endsWith('/')) {
        standardPostUrl = standardPostUrl + '.html';
      }
      
      // Find post title from blogPosts if available
      let postTitle = null;
      parsePostsFromPage();
      if (blogPosts.length > 0) {
        const post = blogPosts.find(p => {
          let postUrl = p.url;
          if (postUrl.startsWith('/')) postUrl = postUrl.substring(1);
          postUrl = postUrl.replace(/\.html$/, '');
          return postUrl === postPath;
        });
        if (post) {
          postTitle = post.title;
        }
      }
      
      // Hide page content
      const pageContent = document.querySelector('.page-content');
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      
      if (pageContent) pageContent.style.display = 'none';
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
      
      // Add terminal-mode class to body
      document.body.classList.add('terminal-mode', 'crt');
      
      // Create terminal container
      const terminalContainer = document.createElement('div');
      terminalContainer.className = 'terminal-container';
      terminalContainer.setAttribute('role', 'application');
      terminalContainer.setAttribute('aria-label', 'Terminal interface');
      
      // Use new variable names to avoid shadowing outer scope let variables
      const newTerminalOutput = document.createElement('div');
      newTerminalOutput.className = 'terminal-output';
      newTerminalOutput.setAttribute('role', 'log');
      newTerminalOutput.setAttribute('aria-live', 'polite');
      newTerminalOutput.setAttribute('aria-atomic', 'false');
      
      const terminalInputLine = document.createElement('div');
      terminalInputLine.className = 'terminal-input-line';
      
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.setAttribute('aria-hidden', 'true');
      prompt.textContent = '$';
      
      const newTerminalInput = document.createElement('input');
      newTerminalInput.type = 'text';
      newTerminalInput.className = 'terminal-input';
      newTerminalInput.setAttribute('autocomplete', 'off');
      newTerminalInput.setAttribute('autocorrect', 'off');
      newTerminalInput.setAttribute('autocapitalize', 'off');
      newTerminalInput.setAttribute('spellcheck', 'false');
      newTerminalInput.setAttribute('aria-label', 'Terminal input');
      newTerminalInput.setAttribute('role', 'textbox');
      
      const newCursor = document.createElement('span');
      newCursor.className = 'cursor';
      newCursor.setAttribute('aria-hidden', 'true');
      newCursor.textContent = '█';
      
      terminalInputLine.appendChild(prompt);
      terminalInputLine.appendChild(newTerminalInput);
      terminalInputLine.appendChild(newCursor);
      
      terminalContainer.appendChild(newTerminalOutput);
      terminalContainer.appendChild(terminalInputLine);
      
      document.body.appendChild(terminalContainer);
      
      // Ensure mode toggle exists and is visible for terminal post views
      // Only skip if we're actually on the 404 page itself (not a /terminal/... URL)
      const isActual404Page = window.location.pathname === '/404.html';
      
      if (!isActual404Page) {
        let toggleButton = document.getElementById('modeToggleFixed');
        if (!toggleButton) {
          toggleButton = document.createElement('button');
          toggleButton.className = 'mode-toggle-fixed';
          toggleButton.id = 'modeToggleFixed';
          toggleButton.setAttribute('aria-label', 'Switch to simple layout');
          toggleButton.textContent = 'Switch to Simple View';
          document.body.appendChild(toggleButton);
        }
        // Ensure button is visible and on top
        toggleButton.style.display = 'block';
        toggleButton.style.visibility = 'visible';
        toggleButton.style.zIndex = '100001';
        // Move toggle after terminal so it stacks on top in DOM order
        document.body.appendChild(toggleButton);
        // Set button text and handler for terminal post view
        toggleButton.textContent = 'Switch to Simple View';
        toggleButton.setAttribute('aria-label', 'Switch to simple layout');
        toggleButton.onclick = () => {
          // Navigate to simple view (regular post URL)
          window.location.href = standardPostUrl;
        };
      }
      
      // Set terminal variables for post view (set global references)
      window.terminalOutput = newTerminalOutput;
      window.terminalInput = newTerminalInput;
      window.terminalCursor = newCursor;
      
      // Also set local variables for post view
      const postTerminalOutput = newTerminalOutput;
      const postTerminalInput = newTerminalInput;
      const postTerminalCursor = newCursor;
      
      // Helper function to add output for post view
      function addPostOutput(text, className = 'terminal-output-text') {
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        postTerminalOutput.appendChild(line);
        // Don't autoscroll when displaying blog content
        // postTerminalOutput.scrollTop = postTerminalOutput.scrollHeight;
      }
      
      // Fetch and display post content
      // Store postTitle in closure for use in fetch callback
      const storedPostTitle = postTitle;
      
      // Add fade-in animation to content
      postTerminalOutput.style.opacity = '0';
      postTerminalOutput.style.transition = 'opacity 0.3s ease-in';
      
      fetch(standardPostUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch post: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(html => {
          // Extract title from HTML if not found from blogPosts
          let finalPostTitle = storedPostTitle;
          if (!finalPostTitle) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const titleElement = tempDiv.querySelector('h1, h2.post-title, .post-title, article h1, article h2');
            if (titleElement) {
              finalPostTitle = titleElement.textContent.trim();
            }
          }
          
          // Display ASCII art title if we have one (with sticky wrapper)
          if (finalPostTitle) {
            // Create sticky title container
            const titleContainer = document.createElement('div');
            titleContainer.className = 'terminal-title-sticky';
            
            const asciiTitle = generateASCIIArt(finalPostTitle);
            
            // Add back arrow to container (not to ASCII art lines)
            const backArrow = document.createElement('span');
            backArrow.className = 'terminal-back-arrow terminal-back-arrow-absolute';
            backArrow.textContent = '←';
            backArrow.setAttribute('aria-label', 'Go back to home');
            backArrow.setAttribute('role', 'button');
            backArrow.setAttribute('tabindex', '0');
            backArrow.addEventListener('click', resetTerminal);
            backArrow.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                resetTerminal();
              }
            });
            titleContainer.appendChild(backArrow);
            
            const titleLines = asciiTitle.split('\n');
            titleLines.forEach((line) => {
              const titleLine = document.createElement('div');
              titleLine.className = 'terminal-line terminal-section-title terminal-section-title-ascii';
              const lineText = document.createElement('span');
              lineText.textContent = line;
              titleLine.appendChild(lineText);
              titleContainer.appendChild(titleLine);
            });
            
            // Insert at the beginning of terminal output
            postTerminalOutput.insertBefore(titleContainer, postTerminalOutput.firstChild);
            addPostOutput('');
          }
          
          // Set flag to disable autoscroll
          isDisplayingBlogContent = true;
          window.isDisplayingBlogContent = true;
          
          // Create reading progress bar
          createReadingProgressBar(postTerminalOutput);
          
          // Parse post content
          const terminalContent = convertHTMLToTerminalText(html, standardPostUrl);
          
          // Render content using post terminal output
          for (const item of terminalContent) {
            switch (item.type) {
              case 'text':
              case 'paragraph':
                addPostOutput(item.content);
                break;
              case 'heading':
                const levelMarkers = { 1: '=', 2: '-', 3: '~' };
                const marker = levelMarkers[item.level] || '-';
                addPostOutput(item.content, 'terminal-section-title');
                addPostOutput(marker.repeat(Math.min(item.content.length, 60)));
                break;
              case 'code':
                if (item.isBlock) {
                  addPostOutput('');
                  const codeLines = item.content.split('\n');
                  codeLines.forEach(line => {
                    const codeLine = document.createElement('div');
                    codeLine.className = 'terminal-line terminal-code';
                    codeLine.textContent = `  ${line}`;
                    postTerminalOutput.appendChild(codeLine);
                  });
                  addPostOutput('');
                } else {
                  addPostOutput(`\`${item.content}\``, 'terminal-code');
                }
                break;
              case 'list':
                addPostOutput('');
                item.items.forEach((itemText, index) => {
                  const prefix = item.ordered ? `${index + 1}.` : '•';
                  addPostOutput(`  ${prefix} ${itemText}`);
                });
                addPostOutput('');
                break;
              case 'blockquote':
                addPostOutput(`> ${item.content}`, 'terminal-info');
                break;
              case 'linebreak':
                addPostOutput('');
                break;
              case 'hr':
                addPostOutput('─'.repeat(60), 'terminal-info');
                break;
              case 'image':
                const imageLine = document.createElement('div');
                imageLine.className = 'terminal-line terminal-image-container';
                if (item.src) {
                  const img = document.createElement('img');
                  img.src = item.src;
                  img.alt = item.alt || 'Image';
                  img.className = 'terminal-image';
                  img.onerror = function() {
                    imageLine.innerHTML = '';
                    imageLine.className = 'terminal-line terminal-output-text';
                    imageLine.appendChild(document.createTextNode(`[Image: ${item.alt || 'Image'}]`));
                  };
                  imageLine.appendChild(img);
                  if (item.alt) {
                    const altText = document.createElement('div');
                    altText.className = 'terminal-image-alt';
                    altText.textContent = item.alt;
                    imageLine.appendChild(altText);
                  }
                } else {
                  imageLine.textContent = `[Image: ${item.alt || 'Image'}]`;
                }
                postTerminalOutput.appendChild(imageLine);
                // Don't autoscroll when displaying blog content
                // postTerminalOutput.scrollTop = postTerminalOutput.scrollHeight;
                break;
              case 'link':
                const linkLine = document.createElement('div');
                linkLine.className = 'terminal-line terminal-output-text';
                linkLine.appendChild(document.createTextNode(item.text));
                if (item.href) {
                  const link = document.createElement('a');
                  link.href = item.href;
                  link.className = 'terminal-post-link';
                  link.textContent = ` [${item.href}]`;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  linkLine.appendChild(link);
                }
                postTerminalOutput.appendChild(linkLine);
                // Don't autoscroll when displaying blog content
                // postTerminalOutput.scrollTop = postTerminalOutput.scrollHeight;
                break;
            }
          }
          
          // Add help message at the end of post content
          addPostOutput('');
          addPostOutput("Type 'help' and press enter to see available commands.", 'terminal-info');
          
          // Fade in the content
          requestAnimationFrame(() => {
            postTerminalOutput.style.opacity = '1';
          });
          
          // Setup scroll listener for progress bar and scroll to title after content is rendered
          setTimeout(() => {
            setupReadingProgressListener(postTerminalOutput);
            const titleContainer = postTerminalOutput.querySelector('.terminal-title-sticky');
            if (titleContainer) {
              titleContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
          
          // Initialize terminal functionality for post view
          if (postTerminalInput && postTerminalOutput && postTerminalCursor) {
            // Parse posts if not already loaded
            // Fetch posts from home page if not available
            if ((!window.jekyllPosts || !Array.isArray(window.jekyllPosts) || window.jekyllPosts.length === 0) && blogPosts.length === 0) {
              fetch('/')
                .then(response => response.text())
                .then(html => {
                  // Extract window.jekyllPosts from home page - look for the full script block
                  // The Liquid template generates JavaScript object literals, not JSON, so we need to execute it
                  const scriptMatch = html.match(/window\.jekyllPosts\s*=\s*(\[[\s\S]*?\]);/);
                  if (scriptMatch && scriptMatch[1]) {
                    try {
                      // Execute the JavaScript code to get the array (it's JS object literal syntax, not JSON)
                      // Use Function constructor to safely execute the code
                      const getPosts = new Function('return ' + scriptMatch[1]);
                      window.jekyllPosts = getPosts();
                      parsePostsFromPage();
                    } catch (e) {
                      // Silently fail - posts will remain empty
                    }
                  }
                })
                .catch(() => {
                  // Silently fail - posts will remain empty
                });
            } else if (blogPosts.length === 0) {
              parsePostsFromPage();
            }
            
            // Set global terminal variables for post view
            terminalOutput = postTerminalOutput;
            terminalInput = postTerminalInput;
            terminalCursor = postTerminalCursor;
            
            // Attach event listeners for terminal functionality
            postTerminalInput.addEventListener('keydown', handleKeyDown);
            postTerminalInput.addEventListener('input', handleInput);
            postTerminalInput.addEventListener('keyup', updateCursorPosition);
            postTerminalInput.addEventListener('click', updateCursorPosition);
            postTerminalInput.addEventListener('select', updateCursorPosition);
            
            // Click on output to focus input
            postTerminalOutput.addEventListener('click', () => {
              postTerminalInput.focus();
            });
            
            // Focus input first
            postTerminalInput.focus();
            
            // Initial cursor position (needs to be after focus)
            setTimeout(() => {
              updateCursorPosition();
              // Ensure input is focused and cursor is positioned correctly
              postTerminalInput.focus();
            }, 0);
          }
        })
        .catch(error => {
          // Remove loading message
          const lastLine = postTerminalOutput.lastElementChild;
          if (lastLine && lastLine.textContent.includes('Loading post:')) {
            postTerminalOutput.removeChild(lastLine);
          }
          
          addPostOutput(`Error loading post: ${error.message}`, 'terminal-error');
          addPostOutput(`Trying to access: ${standardPostUrl}`, 'terminal-info');
        });
      
      return true; // Indicate terminal mode was activated
    }
    
    return false; // No routing needed
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Check for URL-based routing first
      const isPostTerminalMode = handlePostRouting();
      if (!isPostTerminalMode) {
        // Only initialize normal terminal on home page
        initTerminal();
      }
      // Always initialize mode toggle (for home page and blog posts, but not 404)
      initModeToggle();
    });
  } else {
    // Check for URL-based routing first
    const isPostTerminalMode = handlePostRouting();
    if (!isPostTerminalMode) {
      // Only initialize normal terminal on home page
      initTerminal();
    }
    // Always initialize mode toggle (for home page and blog posts, but not 404)
    initModeToggle();
  }
})();
