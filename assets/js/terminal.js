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
  let currentCommand = '';

  // Initialize terminal
  function initTerminal() {
    // Parse posts from fallback content if available
    parsePostsFromPage();

    const container = document.querySelector('.terminal-container');
    if (!container) return;

    terminalOutput = container.querySelector('.terminal-output');
    terminalInput = container.querySelector('.terminal-input');
    
    if (!terminalInput || !terminalOutput) return;

    // Focus input
    terminalInput.focus();

    // Event listeners
    terminalInput.addEventListener('keydown', handleKeyDown);
    terminalInput.addEventListener('input', handleInput);

    // Click on output to focus input
    terminalOutput.addEventListener('click', () => {
      terminalInput.focus();
    });

    // Initial welcome message
    showWelcomeMessage();
  }

  // Show welcome message
  function showWelcomeMessage() {
    // Add greeting
    const greeting = document.createElement('div');
    greeting.className = 'terminal-line terminal-info kirby-container';
    greeting.textContent = "What's up, welcome to the blog homie";
    terminalOutput.appendChild(greeting);
    
    // Create animated Kirby dancing
    const kirbyLine = document.createElement('div');
    kirbyLine.className = 'terminal-line terminal-info kirby-container';
    
    const kirbySpan = document.createElement('span');
    kirbySpan.className = 'kirby-dance';
    kirbyLine.appendChild(kirbySpan);
    
    // Kirby animation frames
    const kirbyFrames = [
      '<(o.o<)  (^o.o^) (>o.o)>',
      '(^o.o^)  (>o.o)  <(o.o<)',
      '(>o.o)  <(o.o<)  (^o.o^)'
    ];
    let currentFrame = 0;
    
    // Set initial frame
    kirbySpan.textContent = kirbyFrames[currentFrame];
    
    // Animate Kirby
    setInterval(() => {
      currentFrame = (currentFrame + 1) % kirbyFrames.length;
      kirbySpan.textContent = kirbyFrames[currentFrame];
    }, 500);
    
    const helpText = document.createElement('div');
    helpText.className = 'terminal-line terminal-info';
    helpText.textContent = "Type 'help' to see available commands.";
    
    terminalOutput.appendChild(kirbyLine);
    terminalOutput.appendChild(helpText);
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
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          terminalInput.value = commandHistory[historyIndex];
          currentCommand = commandHistory[historyIndex];
        } else {
          historyIndex = -1;
          terminalInput.value = '';
          currentCommand = '';
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion(currentCommand);
    }
  }

  // Handle input changes
  function handleInput(e) {
    currentCommand = e.target.value;
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

    // Add to history
    if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== input) {
      commandHistory.push(input);
    }

    // Show command
    addPrompt(input);

    // Parse command
    const parts = input.split(' ');
    const commandName = parts[0].toLowerCase();
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
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    scrollToBottom();
  }

  // Add HTML output to terminal (for formatted content)
  function addHTMLOutput(html, className = 'terminal-output-text') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = html;
    terminalOutput.appendChild(line);
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
    
    // #region agent log
    const imagesInHTML = tempDiv.querySelectorAll('img');
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:286',message:'Finding content element',data:{foundSelector:content!==tempDiv,imageCount:imagesInHTML.length,contentTagName:contentEl.tagName,imageSrcs:Array.from(imagesInHTML).map(img=>img.getAttribute('src'))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

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
          const alt = node.getAttribute('alt') || 'Image';
          let src = node.getAttribute('src') || '';
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:305',message:'Image node found',data:{originalSrc:src,alt:alt,baseUrl:baseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:329',message:'Image parsed with resolved src',data:{resolvedSrc:src,alt:alt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
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
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:407',message:'renderTerminalContent called',data:{contentLength:content.length,hasImages:content.some(c=>c.type==='image'),imageItems:content.filter(c=>c.type==='image').map(i=>({src:i.src,alt:i.alt}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    for (const item of content) {
      switch (item.type) {
        case 'text':
        case 'paragraph':
          addOutput(item.content);
          break;
        case 'heading':
          const levelMarkers = { 1: '=', 2: '-', 3: '~' };
          const marker = levelMarkers[item.level] || '-';
          addOutput(item.content, 'terminal-section-title');
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
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:449',message:'Image case hit in renderTerminalContent',data:{itemSrc:item.src,itemAlt:item.alt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          const imageLine = document.createElement('div');
          imageLine.className = 'terminal-line terminal-image-container';
          if (item.src) {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.alt || 'Image';
            img.className = 'terminal-image';
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:456',message:'Image element created',data:{imgSrc:img.src,imgAlt:img.alt,imgClassName:img.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            img.onerror = function() {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:457',message:'Image onerror fired',data:{failedSrc:img.src},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:470',message:'Image element appended to imageLine',data:{imageLineClassName:imageLine.className,imageLineChildrenCount:imageLine.children.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
          } else {
            imageLine.textContent = `[Image: ${item.alt || 'Image'}]`;
          }
          terminalOutput.appendChild(imageLine);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:480',message:'imageLine appended to terminalOutput',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          scrollToBottom();
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
          terminalOutput.appendChild(linkLine);
          scrollToBottom();
          break;
      }
    }
  }

  // Add prompt line
  function addPrompt(command) {
    const line = document.createElement('div');
    line.className = 'terminal-line terminal-command';
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = '$';
    line.appendChild(prompt);
    line.appendChild(document.createTextNode(' ' + command));
    terminalOutput.appendChild(line);
    scrollToBottom();
  }

  // Scroll to bottom
  function scrollToBottom() {
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
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
        terminalOutput.innerHTML = '';
        showWelcomeMessage();
      }
    },
    {
      name: 'ls',
      aliases: ['list'],
      description: 'List blog posts',
      execute: () => {
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
      description: 'Display post content. Usage: cat <post-slug>',
      execute: (args) => {
        if (args.length === 0) {
          addOutput('Usage: cat <post-slug>', 'terminal-error');
          addOutput('Type "ls" to see available posts.', 'terminal-info');
          return;
        }
        const slug = args.join(' ').toLowerCase();
        const post = blogPosts.find(p => 
          p.slug.toLowerCase() === slug || 
          p.title.toLowerCase() === slug
        );
        if (post) {
          addOutput(`=== ${post.title} ===`, 'terminal-section-title');
          if (post.date) {
            addOutput(`Date: ${post.date}`, 'terminal-info');
          }
          addOutput('');
          
          // Fetch and display full post content
          if (post.url) {
            addOutput('Loading post content...', 'terminal-info');
            fetch(post.url)
              .then(response => {
                if (!response.ok) {
                  throw new Error('Failed to fetch post');
                }
                return response.text();
              })
              .then(html => {
                // Remove the loading message
                const lastLine = terminalOutput.lastElementChild;
                if (lastLine && lastLine.textContent.includes('Loading post content...')) {
                  terminalOutput.removeChild(lastLine);
                }
                
                // Parse and display content
                const terminalContent = convertHTMLToTerminalText(html, post.url);
                renderTerminalContent(terminalContent);
              })
              .catch(error => {
                // Remove the loading message
                const lastLine = terminalOutput.lastElementChild;
                if (lastLine && lastLine.textContent.includes('Loading post content...')) {
                  terminalOutput.removeChild(lastLine);
                }
                
                // Fallback to excerpt if fetch fails
                addOutput(`Error loading full post: ${error.message}`, 'terminal-error');
                if (post.excerpt) {
                  addOutput('');
                  addOutput('Showing excerpt:', 'terminal-info');
                  addOutput(post.excerpt);
                }
                addOutput('');
                addOutput(`View full post: ${post.url}`, 'terminal-info');
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:663',message:'whoami execute called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        fetch('/about/')
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch about page');
            }
            return response.text();
          })
          .then(html => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:672',message:'About page HTML received',data:{htmlLength:html.length,htmlPreview:html.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Remove the loading message
            const lastLine = terminalOutput.lastElementChild;
            if (lastLine && lastLine.textContent.includes('Loading about information...')) {
              terminalOutput.removeChild(lastLine);
            }
            
            // Parse and display content
            const terminalContent = convertHTMLToTerminalText(html, '/about/');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:680',message:'Terminal content parsed',data:{contentLength:terminalContent.length,contentTypes:terminalContent.map(c=>c.type)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
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
            addOutput('Type "about" for more information.', 'terminal-info');
          });
      }
    },
    {
      name: 'about',
      description: 'Show detailed about information',
      execute: () => {
        addOutput('=== About ===', 'terminal-section-title');
        addOutput('');
        addOutput('I\'ve rewritten this quite a bit trying to seem as interesting or as');
        addOutput('professional as possible, but I\'ve since settled on authenticity as');
        addOutput('my main focus. I\'m a software engineer that likes humans as much as');
        addOutput('I like tech, and I want to be excellent so that I can quell my');
        addOutput('existential dread, simple as that.');
        addOutput('');
        addOutput('The problem statement that I\'ve worked on resolving over my past 5');
        addOutput('years in the game was simple:', 'terminal-info');
        addOutput('');
        addOutput('  What does excellence look like to me?', 'terminal-success');
        addOutput('');
        addOutput('After some reflection, life experience, and meditation over various');
        addOutput('quotes from the greatest philosophers of all time (Kanye West and');
        addOutput('Marcus Aurelius of course), I\'ve decided on some quantifiable goals');
        addOutput('that I\'d like to reach during my time.');
        addOutput('');
        addOutput('This blog is basically to aid me in making these things happen.');
        addOutput('I\'d like to get into the habit of creating the things I think are');
        addOutput('fun, funny, or that would help humanity, and I\'d like to get into');
        addOutput('the habit of progressing daily and releasing whatever I think would');
        addOutput('be cool.');
        addOutput('');
        addOutput('Visit /about/ for the full about page with image.', 'terminal-info');
      }
    },
    {
      name: 'date',
      description: 'Show current date and time',
      execute: () => {
        const now = new Date();
        addOutput(now.toLocaleString(), 'terminal-info');
      }
    },
    {
      name: 'contact',
      description: 'Show contact information',
      execute: () => {
        addOutput('Email: ashauntoray@gmail.com', 'terminal-info');
        addOutput('GitHub: lasagnamassage', 'terminal-info');
      }
    }
  ];

  // Mode toggle functionality
  function initModeToggle() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:393',message:'initModeToggle called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const toggleButton = document.getElementById('modeToggle');
    const simpleMode = document.getElementById('simpleMode');
    const body = document.body;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:398',message:'Elements found',data:{toggleButton:!!toggleButton,simpleMode:!!simpleMode,body:!!body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!toggleButton || !simpleMode) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:401',message:'Missing elements, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }

    function switchToSimpleMode() {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:413',message:'switchToSimpleMode called',data:{bodyClasses:body.className,simpleModeClasses:simpleMode.className,beforeDisplay:simpleMode.style.display},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Directly set display property instead of relying on CSS classes
      simpleMode.style.display = 'block';
      simpleMode.classList.add('active');
      body.classList.remove('terminal-mode');
      body.classList.add('simple-mode');
      
      // Hide terminal container directly
      const terminalContainer = document.querySelector('.terminal-container');
      if (terminalContainer) {
        terminalContainer.style.display = 'none';
      }
      
      toggleButton.textContent = 'Switch to Terminal View';
      toggleButton.setAttribute('aria-label', 'Switch to terminal interface');
      sessionStorage.setItem('viewMode', 'simple');
      
      // #region agent log
      const computedStyle = window.getComputedStyle(simpleMode);
      const bodyStyle = window.getComputedStyle(body);
      const contentDiv = simpleMode.querySelector('.simple-mode-content');
      const contentStyle = contentDiv ? window.getComputedStyle(contentDiv) : null;
      const terminalStyle = terminalContainer ? window.getComputedStyle(terminalContainer) : null;
      const pageContent = document.querySelector('.page-content');
      const pageContentStyle = pageContent ? window.getComputedStyle(pageContent) : null;
      const wrapper = document.querySelector('.wrapper');
      const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;
      const parentElement = simpleMode.parentElement;
      const parentStyle = parentElement ? window.getComputedStyle(parentElement) : null;
      const rect = simpleMode.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      const hasContent = simpleMode.innerHTML.length > 0;
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:449',message:'After switchToSimpleMode',data:{bodyClasses:body.className,bodyBackgroundColor:bodyStyle.backgroundColor,simpleModeClasses:simpleMode.className,simpleModeStyleDisplay:simpleMode.style.display,simpleModeComputedDisplay:computedStyle.display,simpleModeVisibility:computedStyle.visibility,simpleModeOpacity:computedStyle.opacity,simpleModePosition:computedStyle.position,simpleModeWidth:computedStyle.width,simpleModeHeight:computedStyle.height,simpleModeZIndex:computedStyle.zIndex,simpleModeTop:computedStyle.top,simpleModeLeft:computedStyle.left,simpleModeRect:JSON.stringify(rect),bodyRect:JSON.stringify(bodyRect),hasContent:hasContent,contentDivExists:!!contentDiv,contentDivDisplay:contentStyle?.display,contentDivVisibility:contentStyle?.visibility,contentDivColor:contentStyle?.color,pageContentDisplay:pageContentStyle?.display,pageContentVisibility:pageContentStyle?.visibility,wrapperDisplay:wrapperStyle?.display,parentTagName:parentElement?.tagName,parentDisplay:parentStyle?.display,parentVisibility:parentStyle?.visibility,terminalContainerDisplay:terminalStyle?.display,terminalContainerZIndex:terminalStyle?.zIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }

    function switchToTerminalMode() {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:452',message:'switchToTerminalMode called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
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
      
      toggleButton.textContent = 'Switch to Simple View';
      toggleButton.setAttribute('aria-label', 'Switch to simple layout');
      sessionStorage.setItem('viewMode', 'terminal');
      // Refocus terminal input
      if (terminalInput) {
        terminalInput.focus();
      }
    }

    // Check for saved preference (sessionStorage - only persists for tab session)
    const savedMode = sessionStorage.getItem('viewMode');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:467',message:'Checking saved mode',data:{savedMode:savedMode,currentBodyClasses:body.className,initialSimpleModeDisplay:simpleMode.style.display},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (savedMode === 'simple') {
      switchToSimpleMode();
    } else {
      // Ensure simple mode is hidden initially if not in simple mode
      simpleMode.style.display = 'none';
    }

    toggleButton.addEventListener('click', () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:445',message:'Toggle button clicked',data:{simpleModeActive:simpleMode.classList.contains('active')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (simpleMode.classList.contains('active')) {
        switchToTerminalMode();
      } else {
        switchToSimpleMode();
      }
    });
  }

  // Initialize on DOM ready
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:449',message:'Initializing terminal, checking DOM state',data:{readyState:document.readyState,bodyClasses:document.body.className,simpleModeExists:!!document.getElementById('simpleMode')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4e55f62b-0624-4ebe-950c-e34572a11236',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'terminal.js:455',message:'DOMContentLoaded fired',data:{bodyClasses:document.body.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      initTerminal();
      initModeToggle();
    });
  } else {
    initTerminal();
    initModeToggle();
  }
})();
