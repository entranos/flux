//
//
//        IMPORT AND EXPORT FUNCTIONS
//
//


// Function to export SVG to PNG with proper font handling
function exportSvgToPng() {
  const svgElement = document.getElementById('energyflows_sankeySVGPARENT');

  if (!svgElement) {
    alert('SVG element not found. Please make sure the sankey diagram is loaded.');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const svgClone = svgElement.cloneNode(true);

  // Get SVG dimensions
  const svgRect = svgElement.getBoundingClientRect();
  const svgWidth = svgElement.getAttribute('width') || svgRect.width;
  const svgHeight = svgElement.getAttribute('height') || svgRect.height;

  // Add font definitions to the SVG
  const defs = svgClone.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  if (!svgClone.querySelector('defs')) {
    svgClone.insertBefore(defs, svgClone.firstChild);
  }

  const fontStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  fontStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
    text {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
  `;
  defs.appendChild(fontStyle);

  // Set SVG attributes for proper rendering
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svgClone.setAttribute('width', svgWidth);
  svgClone.setAttribute('height', svgHeight);

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions with higher resolution for better quality
  const scale = 2;
  canvas.width = parseInt(svgWidth) * scale;
  canvas.height = parseInt(svgHeight) * scale;
  ctx.scale(scale, scale);

  // Set background based on transparent background setting
  const isTransparent = window.currentSankeyConfig && 
                       window.currentSankeyConfig.settings && 
                       window.currentSankeyConfig.settings[0] && 
                       (window.currentSankeyConfig.settings[0].transparentBackground === true || 
                        window.currentSankeyConfig.settings[0].transparentBackground === 'true');
  
  if (!isTransparent) {
    // Set background color from settings or default to white
    const backgroundColor = (window.currentSankeyConfig && 
                           window.currentSankeyConfig.settings && 
                           window.currentSankeyConfig.settings[0] && 
                           window.currentSankeyConfig.settings[0].backgroundColor) || 'white';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, parseInt(svgWidth), parseInt(svgHeight));
    // console.log('PNG export: Set background color to', backgroundColor);
  } else {
    // console.log('PNG export: Using transparent background');
    // For transparent background, we don't fill the canvas at all
    // The canvas will remain transparent
  }

  // Get SVG data from the clone
  const svgData = new XMLSerializer().serializeToString(svgClone);

  // Create a blob and object URL
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create an image element
  const img = new Image();

  img.onload = function () {
    // Wait a bit for fonts to load before drawing
    setTimeout(() => {
      // Before drawing, fix the backdrop widths in the SVG clone
      fixBackdropWidthsForExport(svgClone);
      
      // Recreate the blob with the fixed SVG
      const fixedSvgData = new XMLSerializer().serializeToString(svgClone);
      const fixedSvgBlob = new Blob([fixedSvgData], { type: 'image/svg+xml;charset=utf-8' });
      const fixedUrl = URL.createObjectURL(fixedSvgBlob);
      
      // Create a new image with the fixed SVG
      const fixedImg = new Image();
      fixedImg.onload = function() {
        // Draw the fixed image on canvas
        ctx.drawImage(fixedImg, 0, 0, parseInt(svgWidth), parseInt(svgHeight));

        // Convert canvas to PNG and download
        canvas.toBlob(function (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = 'sankey-diagram.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Clean up URLs
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(fixedUrl);
          URL.revokeObjectURL(downloadUrl);
        }, 'image/png');
      };
      
      fixedImg.src = fixedUrl;
    }, 1000); // Wait 1 second for fonts to load
  };

  img.onerror = function () {
    alert('Failed to export SVG. This might be due to security restrictions or missing elements.');
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

// Helper function to fix backdrop widths for PNG export
function fixBackdropWidthsForExport(svgElement) {
  // console.log('Fixing backdrop widths for PNG export...');
  
  // Get all backdrop elements for titles and values
  const titleBackdrops = svgElement.querySelectorAll('.node-backdrop-title');
  const valueBackdrops = svgElement.querySelectorAll('.node-backdrop-value');

  const valueTexts = svgElement.querySelectorAll('.node-value');
  const titleTexts = svgElement.querySelectorAll('.node-title');
  
  // console.log(`Found ${titleBackdrops.length} title backdrops and ${valueBackdrops.length} value backdrops to fix`);
  
  // Helper function to calculate text width with proper font settings
  function calculateTextWidth(text, fontSize, fontFamily = 'Roboto', fontWeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    return ctx.measureText(text).width;
  }

  titleTexts.forEach((titleText, index) => {
    // const titleContent = titleText.textContent.trim();
    // const titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '500');
    if (titleText.getAttribute("data-labelposition") === 'left'){
    titleText.setAttribute('dx', 5);
  }
  });
  valueTexts.forEach((valueText, index) => {
    const parentNode = valueText.closest('.node');
    // const valueText = parentNode.querySelector('.node-value');
    const valueContent = valueText.textContent.trim();
    const titleText = parentNode.querySelector('.node-title');
    const titleContent =titleText.textContent.trim();
    const titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '300');
    const valueTextWidth = calculateTextWidth(valueContent, '11px', 'Roboto', '300');
    if (valueText.getAttribute("data-labelposition") === 'left'){
    valueText.setAttribute('x', parentNode.getAttribute("x") - titleTextWidth-valueTextWidth-25-15-12);
  }
  });

  titleBackdrops.forEach((titleBackdrop, index) => {
    const parentNode = titleBackdrop.closest('.node');
    const titleText = parentNode.querySelector('.node-title');
    const titleContent = titleText.textContent.trim();
    const titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '300');
    if (titleBackdrop.getAttribute("data-labelposition") === 'left'){
    // const currentX = parseFloat(titleBackdrop.getAttribute("x")) || 0;
    // const currentWidth = parseFloat(titleBackdrop.getAttribute("width")) || 0;
    // titleBackdrop.setAttribute('x', currentX - 10);
    titleBackdrop.setAttribute('x',parentNode.getAttribute("x") -titleTextWidth-25);
    titleBackdrop.setAttribute('width', titleTextWidth);
    }
  });

  valueBackdrops.forEach((valueBackdrop, index) => {

    const parentNode = valueBackdrop.closest('.node');
    const valueText = parentNode.querySelector('.node-value');
    const valueContent = valueText.textContent.trim();
    const titleText = parentNode.querySelector('.node-title');
    const titleContent = titleText.textContent.trim();
    const titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '300');
    const valueTextWidth = calculateTextWidth(valueContent, '11px', 'Roboto', '300');
    
    if (valueBackdrop.getAttribute("data-labelposition") === 'left'){
    // const currentX = parseFloat(valueBackdrop.getAttribute("x")) || 0;
    // valueBackdrop.setAttribute('x', currentX - 15);
    valueBackdrop.setAttribute('x',parentNode.getAttribute("x") -valueTextWidth-titleTextWidth-25-15);
    valueBackdrop.setAttribute('width', valueTextWidth);
    }
  });

  
  // Since the SVG clone might not preserve __data__, we'll use a different approach
  // Get the text content from the corresponding text elements
  
  // Fix title backdrop widths by finding corresponding text elements
  titleBackdrops.forEach((backdrop, index) => {
    const parentNode = backdrop.closest('.node');
    if (parentNode) {
      // Find the corresponding title text element
      const titleText = parentNode.querySelector('.node-title');
      if (titleText && titleText.textContent) {
        const title = titleText.textContent.trim();

       
        
        if (title && !title.startsWith('.') && titleText.getAttribute("data-labelposition") === 'right') {
          // Calculate the actual text width with proper font settings
          const textWidth = calculateTextWidth(title, '11px', 'Roboto', '500');
          // Add original padding plus extra buffer for PNG export
          const newWidth = textWidth; // +10px extra buffer for PNG
          backdrop.setAttribute('width', newWidth);
          // console.log(`Fixed title backdrop for "${title}": ${newWidth}px (text: ${textWidth}px * 1.1)`);
        }
      }
    }
  });
  
  // Fix value backdrop widths and positions by finding corresponding value text elements
  valueBackdrops.forEach((backdrop, index) => {
   
    const parentNode = backdrop.closest('.node');
    
    if (parentNode) {
      // Find the corresponding value text element
      const valueText = parentNode.querySelector('.node-value');
      const titleText = parentNode.querySelector('.node-title');
      
      if (valueText && valueText.textContent) {
        const valueContent = valueText.textContent.trim();
        
        if (valueContent && valueContent !== '0') {
          // Calculate the actual text width with proper font settings
          const textWidth = calculateTextWidth(valueContent, '11px', 'Roboto', '500');

          // Add original padding plus extra buffer for PNG export
          const newWidth = textWidth*1;
          backdrop.setAttribute('width', newWidth);
          
          // Adjust x position to account for expanded title backdrop
          if (titleText && titleText.textContent) {
            var titleContent = titleText.textContent.trim();
            var titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '500');
            var expandedTitleWidth = titleTextWidth;
            
            // Check if this is a right-positioned label (value should be to the right of title)
            const currentX = parseFloat(backdrop.getAttribute('x') || '0');
            if (currentX > 0) { // Right-positioned
              // Position value backdrop after the expanded title backdrop with some spacing
              var newX
              // if ( backdrop.getAttribute("data-labelposition") === 'right'){
              newX = expandedTitleWidth + 30; // 35px spacing between title and value
            // } else if (backdrop.getAttribute("data-labelposition") === 'left'){
            //   newX = -expandedTitleWidth -30; // 35px spacing between title and value
            // }
            

              backdrop.setAttribute('x', newX);
              
              // Also adjust the value text position
              if (valueText) {
                valueText.setAttribute('x', newX + 5-18); // 5px padding inside backdrop
              }
              
              // console.log(`Fixed value backdrop for "${valueContent}": width ${newWidth}px, x position ${newX}px`);
            } else {
              // var titleContent = titleText.textContent.trim()+ valueText.textContent.trim();
              // var titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '500') + 30
              // var expandedTitleWidth = titleTextWidth;
              // titleTextWidth = calculateTextWidth(titleContent, '11px', 'Roboto', '500');
              // var newX=0
              // newX = -expandedTitleWidth; // 35px spacing between title and value
              // backdrop.setAttribute('x', newX);
              // console.log(`Fixed value backdrop for "${valueContent}": width ${newWidth}px (left-positioned, no x adjustment)`);

            }
          } else {
            // console.log(`Fixed value backdrop for "${valueContent}": ${newWidth}px (no title found for positioning)`);
          }
        }
      }
    }
  });
  
  // Additional fallback: increase width of any backdrop element that seems too narrow
  const allBackdrops = svgElement.querySelectorAll('[class*="backdrop"]');
  // console.log(`Found ${allBackdrops.length} total backdrop elements for fallback processing`);
  
  allBackdrops.forEach(backdrop => {
    const currentWidth = parseFloat(backdrop.getAttribute('width') || '0');
    if (currentWidth > 0 && currentWidth < 1000) { // If width seems reasonable but might be too narrow
      if ( backdrop.getAttribute("data-labelposition") === 'right'){
        newWidth = currentWidth + 10; // Add 10px buffer
      } else if (backdrop.getAttribute("data-labelposition") === 'left'){
        newWidth = currentWidth + 10; // Add 10px buffer
      }
      backdrop.setAttribute('width', newWidth);
      // console.log(`Applied fallback width increase: ${currentWidth}px -> ${newWidth}px`);
    }
  });
  
  // console.log(`Processed ${titleBackdrops.length} title backdrops and ${valueBackdrops.length} value backdrops`);
}

// Helper function to clean link data for export by removing D3-specific properties
function cleanLinksForExport(links) {
  if (!links || !Array.isArray(links)) {
    return [];
  }
  
  return links.map(link => {
    // Create a clean copy of the link with only the essential properties
    const cleanLink = {};
    
    // Copy all properties except D3-specific ones
    Object.keys(link).forEach(key => {
      // Skip D3-specific properties that shouldn't be exported
      if (key === 'points' || key === 'source' || key === 'target' || 
          key === 'index' || key === 'y0' || key === 'y1' || 
          key === 'width' || key === 'circular') {
        return; // Skip these properties
      }
      
      cleanLink[key] = link[key];
    });
    
    // Ensure we have the correct source/target format for Excel
    if (link['source.id']) {
      cleanLink['source.id'] = link['source.id'];
    } else if (link.source && typeof link.source === 'object' && link.source.id) {
      cleanLink['source.id'] = link.source.id;
    } else if (link.source) {
      cleanLink['source.id'] = link.source;
    }
    
    if (link['target.id']) {
      cleanLink['target.id'] = link['target.id'];
    } else if (link.target && typeof link.target === 'object' && link.target.id) {
      cleanLink['target.id'] = link.target.id;
    } else if (link.target) {
      cleanLink['target.id'] = link.target;
    }
    
    // Ensure carrier property is set (fallback to legend if carrier doesn't exist)
    if (!cleanLink.carrier && cleanLink.legend) {
      cleanLink.carrier = cleanLink.legend;
    }
    
    // Ensure type property exists (default to 0 if missing)
    if (cleanLink.type === undefined || cleanLink.type === null) {
      cleanLink.type = 0;
    }
    
    return cleanLink;
  });
}

// Helper function to remove 'name' and 'title' columns from export data
function filterExportColumns(data, sheetType) {
  if (!data || !Array.isArray(data)) {
    return data;
  }
  
  const originalColumns = data.length > 0 ? Object.keys(data[0]) : [];
  let filteredColumns = [];
  let removedColumns = [];
  
  const filteredData = data.map(item => {
    const filteredItem = {};
    
    // Copy all properties with specific filtering rules per sheet type
    Object.keys(item).forEach(key => {
      let shouldInclude = true;
      
      // Filter rules based on sheet type
      if (sheetType === 'carriers') {
        // For carriers sheet, keep all columns (especially id and color)
        shouldInclude = true;
      } else {
        // For other sheets, apply normal filtering
        if (key === 'name') {
          shouldInclude = false;
        }
        // Filter out 'title' column only from non-nodes sheets
        else if (key === 'title' && sheetType !== 'nodes') {
          shouldInclude = false;
        }
      }
      
      if (shouldInclude) {
        filteredItem[key] = item[key];
        if (filteredColumns.indexOf(key) === -1) {
          filteredColumns.push(key);
        }
      } else {
        if (removedColumns.indexOf(key) === -1) {
          removedColumns.push(key);
        }
      }
    });
    
    return filteredItem;
  });
  
  // Log the filtering results
  if (removedColumns.length > 0) {
    // console.log(`Filtered out columns from ${sheetType} sheet:`, removedColumns);
    // console.log(`Remaining columns in ${sheetType} sheet:`, filteredColumns);
  } else {
    // console.log(`No unwanted columns found in ${sheetType} sheet`);
  }
  
  return filteredData;
}

// Function to calculate and display node balance information
function checkNodeBalance() {
  // console.log('=== CHECKING NODE BALANCE ===');
  
  const balanceContent = document.getElementById('nodeBalanceContent');
  if (!balanceContent) {
    console.warn('Node balance content container not found');
    return;
  }

  // Get current nodes and links data
  const nodes = window.nodesGlobal || (window.sankeyDataObject && window.sankeyDataObject.nodes) || [];
  const links = window.links || (window.sankeyDataObject && window.sankeyDataObject.links) || [];

  if (nodes.length === 0 || links.length === 0) {
    balanceContent.innerHTML = '<div class="balance-placeholder">No data available for balance checking</div>';
    return;
  }

  // console.log(`Checking balance for ${nodes.length} nodes and ${links.length} links`);

  // Calculate balance for each node
  const nodeBalances = new Map();
  
  // Initialize all nodes with zero balance
  nodes.forEach(node => {
    const nodeId = node.id;
    nodeBalances.set(nodeId, {
      node: node,
      incoming: 0,
      outgoing: 0,
      incomingCount: 0,
      outgoingCount: 0
    });
  });

  // Process all links to calculate incoming and outgoing flows
  links.forEach(link => {
    const value = parseFloat(link.value) || 0;
    if (value === 0) return; // Skip zero-value links

    // Get source and target IDs (handle different data structures)
    let sourceId, targetId;
    
    if (typeof link.source === 'object' && link.source.id) {
      sourceId = link.source.id;
    } else if (link['source.id']) {
      sourceId = link['source.id'];
    } else if (typeof link.source === 'string') {
      sourceId = link.source;
    }
    
    if (typeof link.target === 'object' && link.target.id) {
      targetId = link.target.id;
    } else if (link['target.id']) {
      targetId = link['target.id'];
    } else if (typeof link.target === 'string') {
      targetId = link.target;
    }

    if (!sourceId || !targetId) {
      console.warn('Link missing source or target ID:', link);
      return;
    }

    // Add to outgoing flows for source node
    if (nodeBalances.has(sourceId)) {
      const sourceBalance = nodeBalances.get(sourceId);
      sourceBalance.outgoing += value;
      sourceBalance.outgoingCount++;
    }

    // Add to incoming flows for target node
    if (nodeBalances.has(targetId)) {
      const targetBalance = nodeBalances.get(targetId);
      targetBalance.incoming += value;
      targetBalance.incomingCount++;
    }
  });

  // Find unbalanced nodes (difference > 1)
  // Exclude nodes that have no incoming OR no outgoing flows (source/sink nodes)
  const unbalancedNodes = [];
  const balancedNodes = [];

  nodeBalances.forEach((balance, nodeId) => {
    const difference = Math.abs(balance.incoming - balance.outgoing);
    
    // Skip nodes that are sources (no incoming) or sinks (no outgoing)
    // These are expected to be unbalanced by design
    if (balance.incoming === 0 || balance.outgoing === 0) {
      // console.log(`Skipping source/sink node: ${balance.node.title || balance.node.name || nodeId} (In: ${balance.incoming}, Out: ${balance.outgoing})`);
      return; // Skip this node
    }
    
    const balanceInfo = {
      ...balance,
      difference: difference,
      isCritical: difference > 10 // Mark as critical if difference > 10
    };

    if (difference > 1) {
      unbalancedNodes.push(balanceInfo);
    } else {
      balancedNodes.push(balanceInfo);
    }
  });

  // console.log(`Found ${unbalancedNodes.length} unbalanced nodes and ${balancedNodes.length} balanced nodes`);

  // Generate HTML content
  let html = '';

  if (unbalancedNodes.length === 0) {
    html = '<div class="balance-status balanced">✅ All nodes are balanced (flow differences ≤ 1)</div>';
  } else {
    html = `
      <div class="balance-status">
        ⚠️ Found ${unbalancedNodes.length} unbalanced node${unbalancedNodes.length > 1 ? 's' : ''} 
        (${balancedNodes.length} balanced, root and terminal nodes ignored)
      </div>
      <div class="unbalanced-nodes">
    `;

    // Sort unbalanced nodes by difference (highest first)
    unbalancedNodes.sort((a, b) => b.difference - a.difference);

    unbalancedNodes.forEach(balance => {
      const nodeTitle = balance.node.title || balance.node.name || 'Unnamed Node';
      const nodeId = balance.node.id;
      const difference = balance.difference.toFixed(2);
      const incoming = balance.incoming.toFixed(2);
      const outgoing = balance.outgoing.toFixed(2);
      
      const criticalClass = balance.isCritical ? ' critical' : '';
      
      html += `
        <div class="unbalanced-node${criticalClass}">
          <div class="node-info">
            <div class="node-name">${nodeTitle}</div>
            <div class="node-id">ID: ${nodeId}</div>
            <div class="balance-flows">In: ${incoming} | Out: ${outgoing}</div>
          </div>
          <div class="balance-difference">Δ ${difference}</div>
        </div>
      `;
    });

    html += '</div>';
  }

  balanceContent.innerHTML = html;
  // console.log('Node balance check completed');
}

// Make the function globally available
window.checkNodeBalance = checkNodeBalance;

// Function to show the manual popup
function showManual() {
  // console.log('Opening user manual...');
  
  // Hide any existing popups
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Show the popup overlay
  const popupOverlay = document.getElementById('editPopupContainer');
  if (popupOverlay) {
    popupOverlay.style.display = 'flex';
  }
  
  // Show the manual popup
  const manualPopup = document.getElementById('manualPopup');
  if (manualPopup) {
    manualPopup.style.display = 'block';
  }
}

// Make the function globally available
window.showManual = showManual;

// Function to export complete Excel file with updated data
function exportToExcel() {
  // console.log('=== FULL EXCEL EXPORT DEBUG ===');

  // Check if we have the original Excel data structure
  if (!window.originalExcelData) {
    alert('No original Excel data found. Please make sure a file has been loaded.');
    // console.error('No original Excel data available for export');
    return;
  }

  // console.log('Original Excel data available:', window.originalExcelData);
  // console.log('Original workbook available:', !!window.originalWorkbook);

  if (window.originalWorkbook) {
    // console.log('Original workbook sheet names:', window.originalWorkbook.SheetNames);
    // console.log('Number of sheets in original:', window.originalWorkbook.SheetNames.length);
  }

  // Debug: Check what data is available
  // console.log('=== DATA AVAILABILITY CHECK ===');
  // console.log('window.nodesGlobal available:', !!window.nodesGlobal, window.nodesGlobal ? window.nodesGlobal.length : 'N/A');
  // console.log('window.links available:', !!window.links, window.links ? window.links.length : 'N/A');
  // console.log('window.originalLinksData available:', !!window.originalLinksData, window.originalLinksData ? window.originalLinksData.length : 'N/A');
  // console.log('sankeyDataObject available:', !!sankeyDataObject);
  if (sankeyDataObject) {
    // console.log('sankeyDataObject.nodes available:', !!sankeyDataObject.nodes, sankeyDataObject.nodes ? sankeyDataObject.nodes.length : 'N/A');
    // console.log('sankeyDataObject.links available:', !!sankeyDataObject.links, sankeyDataObject.links ? sankeyDataObject.links.length : 'N/A');
  }

  // Get current data with all modifications (including edits)
  const currentNodes = window.nodesGlobal || (sankeyDataObject && sankeyDataObject.nodes ? sankeyDataObject.nodes : []);
  
  // SIMPLIFIED: Use originalLinksData directly like YAML export does
  // This avoids any cleaning/formatting issues
  const currentLinks = window.originalLinksData || window.links;
  
  const currentLegend = window.carriers;
  const currentSettings = window.settings;
  const currentRemarks = window.remarks;

  if (!currentNodes || !currentLinks || !currentLegend || !currentSettings) {
    alert('Missing current data for export. Please ensure the diagram is fully loaded.');
    return;
  }

  // console.log('Current data:', {
  //   nodes: currentNodes.length,
  //   links: currentLinks.length,
  //   carriers: currentLegend.length,  // currentLegend contains carriers data
  //   settings: currentSettings.length,
  //   remarks: currentRemarks ? currentRemarks.length : 0
  // });

  // SIMPLIFIED: Map nodes to clean structure like YAML export does
  const updatedNodes = currentNodes.map(node => ({
    id: node.id,
    title: node.title,
    x: node.x !== undefined ? node.x : node.x0,
    y: node.y !== undefined ? node.y : node.y0,
    direction: node.direction,
    labelposition: node.labelposition
  }));

  // Transform current settings back to original format (reverse the transformData function)
  const updatedSettings = [];
  if (currentSettings && currentSettings[0]) {
    Object.keys(currentSettings[0]).forEach(key => {
      updatedSettings.push({
        setting: key,
        waarde: currentSettings[0][key]
      });
    });
  }

  // Ensure all control panel settings are included in the export
  const controlPanelInputs = [
    { id: 'scaleDataValue', setting: 'scaleDataValue', type: 'number' },
    { id: 'scaleHeight', setting: 'scaleHeight', type: 'number' },
    { id: 'scaleCanvas', setting: 'scaleCanvas', type: 'number' },
    { id: 'canvasWidth', setting: 'canvasWidth', type: 'number' },
    { id: 'canvasHeight', setting: 'canvasHeight', type: 'number' },
    { id: 'diagramTitle', setting: 'title', type: 'text' },
    { id: 'titleFontSize', setting: 'titleFontSize', type: 'number' },
    { id: 'titlePositionX', setting: 'titlePositionX', type: 'number' },
    { id: 'titlePositionY', setting: 'titlePositionY', type: 'number' },
    { id: 'titleColor', setting: 'titleColor', type: 'text' },
    { id: 'backgroundColor', setting: 'backgroundColor', type: 'text' },
    { id: 'nodeWidth', setting: 'nodeWidth', type: 'number' },
      { id: 'nodeColor', setting: 'nodeColor', type: 'text' },
      { id: 'labelFillColor', setting: 'labelFillColor', type: 'text' },
      { id: 'labelTextColor', setting: 'labelTextColor', type: 'text' },
    { id: 'showValueLabelsToggle', setting: 'showValueLabels', type: 'boolean' },
    { id: 'transparentBackgroundToggle', setting: 'transparentBackground', type: 'boolean' },
    { id: 'unitSetting', setting: 'unit', type: 'text' },
    { id: 'decimalsRoundValues', setting: 'decimalsRoundValues', type: 'number' }
  ];

  controlPanelInputs.forEach(input => {
    const element = document.getElementById(input.id);
    let value;
    let hasValue = false;

    if (input.type === 'boolean') {
      // Handle checkbox inputs
      if (element) {
        value = element.checked ? 'Yes' : 'No';
        hasValue = true;
      }
    } else if (element && element.value !== '') {
      // Handle text and number inputs
      value = element.value;
      if (input.type === 'number') {
        value = parseFloat(value);
        if (isNaN(value)) return;
      }
      hasValue = true;
    }

    if (hasValue) {
      // Check if setting already exists in updatedSettings
      const existingSetting = updatedSettings.find(s => s.setting === input.setting);
      if (existingSetting) {
        existingSetting.waarde = value;
      } else {
        updatedSettings.push({
          setting: input.setting,
          waarde: value
        });
      }
    }
  });

  // Also ensure legend colors are exported (they're already in the legend data)
  // The legend data is exported separately, so legend colors will be preserved

  // console.log('Updated settings:', updatedSettings.slice(0, 3));

  // Create workbook - start with original if available, otherwise create new
  let wb;
  if (window.originalWorkbook) {
    // Clone the original workbook to preserve all sheets and formulas
    wb = XLSX.utils.book_new();

    // Copy workbook properties from original
    if (window.originalWorkbook.Props) {
      wb.Props = { ...window.originalWorkbook.Props };
    }
    if (window.originalWorkbook.Workbook) {
      wb.Workbook = JSON.parse(JSON.stringify(window.originalWorkbook.Workbook));
    }

    // console.log('Copying all sheets from original workbook...');
    // console.log('Original sheet names:', window.originalWorkbook.SheetNames);

    // Copy ALL sheets from original workbook first
    window.originalWorkbook.SheetNames.forEach(sheetName => {
      const originalSheet = window.originalWorkbook.Sheets[sheetName];
      // console.log(`Copying sheet: ${sheetName}`);

      if (originalSheet) {
        // Try to preserve the sheet structure as much as possible
        let clonedSheet;
        try {
          // Method 1: Deep clone with JSON (preserves most data)
          clonedSheet = JSON.parse(JSON.stringify(originalSheet));
          // console.log(`  - JSON clone successful for ${sheetName}`);
        } catch (error) {
          console.warn(`  - JSON clone failed for ${sheetName}, using direct reference:`, error);
          // Method 2: Direct reference (less safe but preserves complex objects)
          clonedSheet = { ...originalSheet };
        }

        // Ensure the sheet has the required properties
        if (!clonedSheet['!ref'] && originalSheet['!ref']) {
          clonedSheet['!ref'] = originalSheet['!ref'];
        }

        XLSX.utils.book_append_sheet(wb, clonedSheet, sheetName);
        // console.log(`  - Successfully added ${sheetName} to workbook`);
      } else {
        console.warn(`  - Sheet ${sheetName} is null or undefined`);
      }
    });

    // console.log('Final copied sheets:', wb.SheetNames);
    // console.log('Total sheets in new workbook:', wb.SheetNames.length);
  } else {
    // Fallback: create new workbook
    wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "Sankeyfy Export",
      Subject: "Updated Sankey Diagram Data",
      Author: "Sankeyfy Tool",
      CreatedDate: new Date()
    };
  }

  // SIMPLIFIED: Export data directly without filtering (like YAML export)
  const sheetsToUpdate = [
    { name: 'links', data: currentLinks },
    { name: 'nodes', data: updatedNodes },
    { name: 'carriers', data: currentLegend },
    { name: 'settings', data: updatedSettings },
    { name: 'remarks', data: currentRemarks || [] }
  ];

  // Now update only the specific sheets that need current data
  sheetsToUpdate.forEach(sheet => {
    if (sheet.data && sheet.data.length > 0) {
      // console.log(`Updating sheet: ${sheet.name} with ${sheet.data.length} rows`);

      // Try to preserve original worksheet structure if available
      let ws;
      const originalSheet = window.originalWorkbook?.Sheets?.[sheet.name];
      
      // console.log(`Processing sheet: ${sheet.name}, has original: ${!!originalSheet}, data length: ${sheet.data.length}`);
      
      // For now, disable structure preservation to avoid duplication issues
      // TODO: Re-enable structure preservation once duplication bug is fixed
      // console.log(`Creating new worksheet for ${sheet.name} with ${sheet.data.length} rows`);
      ws = XLSX.utils.json_to_sheet(sheet.data);
      
      // if (originalSheet && (sheet.name === 'links' || sheet.name === 'nodes')) {
      //   // For links and nodes, preserve original structure by updating cells in place
      //   ws = JSON.parse(JSON.stringify(originalSheet)); // Deep copy original sheet
      //   console.log(`Preserving original structure for ${sheet.name} sheet`);
      //   
      //   // Debug: Check original sheet data count
      //   const originalDataCount = XLSX.utils.sheet_to_json(originalSheet).length;
      //   console.log(`Original ${sheet.name} sheet had ${originalDataCount} data rows`);
      //   
      //   // Update the worksheet with current data while preserving structure
      //   const preservationResult = updateWorksheetPreservingStructure(ws, sheet.data, sheet.name);
      //   
      //   // Debug: Check final sheet data count
      //   const finalDataCount = XLSX.utils.sheet_to_json(ws).length;
      //   console.log(`Final ${sheet.name} sheet has ${finalDataCount} data rows (expected: ${sheet.data.length})`);
      //   
      //   // If structure preservation failed, fall back to creating new sheet
      //   if (preservationResult === false) {
      //     console.log(`Structure preservation failed for ${sheet.name}, creating new sheet`);
      //     ws = XLSX.utils.json_to_sheet(sheet.data);
      //   }
      // } else {
      //   // For other sheets or if no original available, create new worksheet
      //   console.log(`Creating new worksheet for ${sheet.name} with ${sheet.data.length} rows`);
      //   ws = XLSX.utils.json_to_sheet(sheet.data);
      // }

      // Set appropriate column widths based on sheet type
      let colWidths = [];
      if (sheet.name === 'nodes') {
        colWidths = [
          { wch: 15 }, // id
          { wch: 20 }, // title  
          { wch: 10 }, // column
          { wch: 12 }, // direction
          { wch: 15 }, // x
          { wch: 15 }, // y
          { wch: 15 }, // labelposition
          { wch: 10 }  // other fields
        ];
      } else if (sheet.name === 'settings') {
        colWidths = [
          { wch: 25 }, // setting
          { wch: 15 }  // waarde
        ];
      } else if (sheet.name === 'links') {
        colWidths = [
          { wch: 15 }, // source
          { wch: 15 }, // target
          { wch: 12 }, // legend
          { wch: 15 }  // values
        ];
      } else {
        // Default widths for other sheets
        colWidths = [{ wch: 15 }, { wch: 15 }, { wch: 15 }];
      }

      ws['!cols'] = colWidths;

      // Apply header row formatting using a more compatible approach
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);

        // Create a style object that should work with most SheetJS versions
        const headerStyle = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FF000000" },
            bgColor: { rgb: "FF000000" }
          },
          font: {
            name: "Arial",
            sz: 11,
            bold: true,
            color: { rgb: "FFFFFFFF" }
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: false
          },
          border: {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } }
          }
        };

        // Apply to all cells in the first row
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (ws[cellAddress]) {
            ws[cellAddress].s = JSON.parse(JSON.stringify(headerStyle)); // Deep copy
            // Also try setting the cell type to ensure it's treated as styled
            if (!ws[cellAddress].t) ws[cellAddress].t = 's'; // String type
          }
        }

        // console.log(`Styled header row for ${sheet.name}: ${range.e.c + 1} columns`);
      }

      // Replace the existing sheet in the workbook
      if (wb.SheetNames.includes(sheet.name)) {
        // console.log(`  - Replacing existing sheet: ${sheet.name}`);
        // Remove the old sheet
        delete wb.Sheets[sheet.name];
        const sheetIndex = wb.SheetNames.indexOf(sheet.name);
        wb.SheetNames.splice(sheetIndex, 1);
      } else {
        // console.log(`  - Adding new sheet: ${sheet.name}`);
      }

      // Add the updated sheet
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      // console.log(`  - Sheet ${sheet.name} updated successfully`);
    }
  });

  // Generate filename based on original filename + timestamp
  const now = new Date();
  const dateStr = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0');

  let filename;
  if (window.originalFilename) {
    // Remove extension from original filename
    let nameWithoutExt = window.originalFilename.replace(/\.[^/.]+$/, '');
    
    // Strip any existing _updated_timestamp patterns to prevent cascading timestamps
    // Pattern matches: _updated_YYYYMMDD_HHMM (and any additional cascaded patterns)
    nameWithoutExt = nameWithoutExt.replace(/_updated_\d{8}_\d{4}.*$/, '');
    
    filename = `${nameWithoutExt}_updated_${dateStr}.xlsx`;
    // console.log('Using original filename base:', window.originalFilename, '→', nameWithoutExt, '→', filename);
  } else {
    // Fallback to default name if no original filename available
    filename = `sankeyfy_updated_${dateStr}.xlsx`;
    // console.log('No original filename found, using default:', filename);
  }

  // Final summary before export
  // console.log('=== FINAL EXPORT SUMMARY ===');
  // console.log('Total sheets in export workbook:', wb.SheetNames.length);
  // console.log('All sheet names:', wb.SheetNames);

  // Check each sheet exists
  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    if (sheet) {
      const cellCount = Object.keys(sheet).filter(key => !key.startsWith('!')).length;
      // console.log(`  - ${sheetName}: ${cellCount} cells`);
    } else {
      console.error(`  - ${sheetName}: MISSING SHEET DATA!`);
    }
  });

  // Export the file with styling options
  try {
    // Check if styling is supported and log debug info
    // console.log('XLSX version info:', XLSX.version || 'Version not available');
    // console.log('Sample styled cell:', wb.Sheets[Object.keys(wb.Sheets)[0]]['A1']);

    // Try different write options for better compatibility
    const writeOptions = {
      bookType: 'xlsx',
      type: 'binary',
      cellStyles: true,
      sheetStubs: false,
      bookSST: false
    };

    // console.log('Writing file with options:', writeOptions);
    XLSX.writeFile(wb, filename, writeOptions);
    // console.log('Successfully exported complete Excel file to:', filename);

    // Additional debug: check if styles were applied
    const firstSheet = wb.Sheets[Object.keys(wb.Sheets)[0]];
    if (firstSheet && firstSheet['A1'] && firstSheet['A1'].s) {
      // console.log('Header styling appears to be applied:', firstSheet['A1'].s);
    } else {
      console.warn('Header styling may not have been applied - check SheetJS version compatibility');
    }

    // Show success message
    const originalText = document.getElementById('exportNodesButton').innerHTML;
    document.getElementById('exportNodesButton').innerHTML = `
       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <polyline points="20,6 9,17 4,12"></polyline>
       </svg>
       Exported!
     `;

    setTimeout(() => {
      document.getElementById('exportNodesButton').innerHTML = originalText;
    }, 2000);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export Excel file. Please check the console for details.');
  }
}

// ========================================
// EXPORT FORMAT MANAGEMENT (JSON/YAML)
// ========================================

// Get the current export format from localStorage (default: 'json')
function getExportFormat() {
  return localStorage.getItem('diagramExportFormat') || 'json';
}

// Set the export format in localStorage
function setExportFormat(format) {
  localStorage.setItem('diagramExportFormat', format);
}

// Update button labels based on format
function updateButtonLabels(format) {
  const formatUpper = format.toUpperCase();
  document.getElementById('importButtonLabel').textContent = `Import ${formatUpper}`;
  document.getElementById('exportButtonLabel').textContent = `Export ${formatUpper}`;
}

// Handle format change from dropdown
function updateExportFormat(format) {
  setExportFormat(format);
  updateButtonLabels(format);
  // console.log(`Export format changed to: ${format.toUpperCase()}`);
}

// Initialize export format on page load
function initializeExportFormat() {
  const savedFormat = getExportFormat();
  const formatSelect = document.getElementById('exportFormat');
  if (formatSelect) {
    formatSelect.value = savedFormat;
    updateButtonLabels(savedFormat);
  }
}

// Wrapper function for export - calls JSON or YAML based on setting
function exportData() {
  const format = getExportFormat();
  if (format === 'yaml') {
    exportToYAML();
  } else {
    exportToJSON();
  }
}

// Wrapper function for import - calls JSON or YAML based on setting
function importData() {
  const format = getExportFormat();
  if (format === 'yaml') {
    importYAMLFile();
  } else {
    importJSONFile();
  }
}

// Make functions globally available
window.updateExportFormat = updateExportFormat;
window.exportData = exportData;
window.importData = importData;

// JSON Export Function
function exportToJSON() {
  // console.log('=== JSON EXPORT STARTED ===');

  // Get current data with all modifications
  const currentNodes = window.nodesGlobal || (sankeyDataObject && sankeyDataObject.nodes ? sankeyDataObject.nodes : []);
  
  // SIMPLIFIED: Use originalLinksData directly like YAML export does
  const currentLinks = window.originalLinksData || window.links;
  
  const currentCarriers = window.carriers || window.legend || [];
  const currentSettings = window.settings || [];
  const currentRemarks = window.remarks || [];

  if (!currentNodes || !currentLinks || !currentCarriers || !currentSettings) {
    alert('Missing current data for export. Please ensure the diagram is fully loaded.');
    return;
  }

  // Create updated nodes data with current positions
  const updatedNodes = currentNodes.map(node => {
    const originalNode = window.originalExcelData && window.originalExcelData.nodes 
      ? window.originalExcelData.nodes.find(n => n.id === node.id) || {}
      : {};
    return {
      id: node.id || originalNode.id,
      title: node.title || originalNode.title,
      x: node.x !== undefined ? node.x : (node.x0 !== undefined ? node.x0 : originalNode.x),
      y: node.y !== undefined ? node.y : (node.y0 !== undefined ? node.y0 : originalNode.y),
      direction: node.direction || originalNode.direction,
      labelposition: node.labelposition || originalNode.labelposition
    };
  });

  // Transform settings back to original format (reverse the transformData function)
  // Settings are stored as [{key1: value1, key2: value2, ...}]
  // Need to convert to [{setting: key1, waarde: value1}, {setting: key2, waarde: value2}, ...]
  const updatedSettings = [];
  if (currentSettings && currentSettings[0]) {
    Object.keys(currentSettings[0]).forEach(key => {
      updatedSettings.push({
        setting: key,
        waarde: currentSettings[0][key]
      });
    });
  }

  // Ensure all control panel settings are included in the export
  const controlPanelInputs = [
    { id: 'scaleDataValue', setting: 'scaleDataValue', type: 'number' },
    { id: 'scaleHeight', setting: 'scaleHeight', type: 'number' },
    { id: 'scaleCanvas', setting: 'scaleCanvas', type: 'number' },
    { id: 'canvasWidth', setting: 'canvasWidth', type: 'number' },
    { id: 'canvasHeight', setting: 'canvasHeight', type: 'number' },
    { id: 'diagramTitle', setting: 'title', type: 'text' },
    { id: 'titleFontSize', setting: 'titleFontSize', type: 'number' },
    { id: 'titlePositionX', setting: 'titlePositionX', type: 'number' },
    { id: 'titlePositionY', setting: 'titlePositionY', type: 'number' },
    { id: 'titleColor', setting: 'titleColor', type: 'text' },
    { id: 'backgroundColor', setting: 'backgroundColor', type: 'text' },
    { id: 'globalFlowOpacity', setting: 'globalFlowOpacity', type: 'number' },
    { id: 'nodeWidth', setting: 'nodeWidth', type: 'number' },
    { id: 'nodePadding', setting: 'nodePadding', type: 'number' },
    { id: 'nodeColor', setting: 'nodeColor', type: 'text' },
    { id: 'labelFontSize', setting: 'labelFontSize', type: 'number' },
    { id: 'labelFillColor', setting: 'labelFillColor', type: 'text' },
    { id: 'labelTextColor', setting: 'labelTextColor', type: 'text' },
    { id: 'labelBold', setting: 'labelBold', type: 'boolean' },
    { id: 'labelItalic', setting: 'labelItalic', type: 'boolean' },
    { id: 'valueFontSize', setting: 'valueFontSize', type: 'number' },
    { id: 'valueFillColor', setting: 'valueFillColor', type: 'text' },
    { id: 'valueBold', setting: 'valueBold', type: 'boolean' },
    { id: 'valueItalic', setting: 'valueItalic', type: 'boolean' },
    { id: 'showValueLabelsToggle', setting: 'showValueLabels', type: 'boolean' },
    { id: 'transparentBackgroundToggle', setting: 'transparentBackground', type: 'boolean' },
    { id: 'enableMouseInteractions', setting: 'enableMouseInteractions', type: 'boolean' },
    { id: 'unitSetting', setting: 'unit', type: 'text' },
    { id: 'decimalsRoundValues', setting: 'decimalsRoundValues', type: 'number' }
  ];

  controlPanelInputs.forEach(input => {
    const element = document.getElementById(input.id);
    let value;
    let hasValue = false;

    if (input.type === 'boolean') {
      // Handle checkbox inputs
      if (element) {
        value = element.checked ? 'Yes' : 'No';
        hasValue = true;
      }
    } else if (element && element.value !== '') {
      // Handle text and number inputs
      value = element.value;
      if (input.type === 'number') {
        value = parseFloat(value);
        if (isNaN(value)) return;
      }
      hasValue = true;
    }

    if (hasValue) {
      // Check if setting already exists in updatedSettings
      const existingSetting = updatedSettings.find(s => s.setting === input.setting);
      if (existingSetting) {
        existingSetting.waarde = value;
      } else {
        updatedSettings.push({
          setting: input.setting,
          waarde: value
        });
      }
    }
  });

  // Create the JSON data structure
  const jsonData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    nodes: updatedNodes,
    links: currentLinks,
    carriers: currentCarriers,
    settings: updatedSettings,
    remarks: currentRemarks
  };

  // Convert to JSON string with formatting
  const jsonString = JSON.stringify(jsonData, null, 2);

  // Create a blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `flux_diagram_${timestamp}.json`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // console.log('JSON export completed successfully');
  
  // Update button text temporarily
  const exportButton = document.getElementById('exportJsonButton');
  if (exportButton) {
    const originalText = exportButton.innerHTML;
    exportButton.innerHTML = 'Exported ✓';
    setTimeout(() => {
      exportButton.innerHTML = originalText;
    }, 2000);
  }
}

// JSON Import Function
function importJSONFile() {
  // console.log('=== JSON IMPORT STARTED ===');
  
  // Create file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // console.log('File read successfully, parsing JSON data...');
        
        // Parse JSON data
        const jsonData = JSON.parse(event.target.result);
        
        // console.log('JSON data parsed successfully:', jsonData);
        
        // Validate required data
        if (!jsonData.nodes || !jsonData.links || !jsonData.carriers || !jsonData.settings) {
          throw new Error('Missing required data in JSON file. Required: nodes, links, carriers, settings');
        }
        
        // console.log('Settings format in JSON:', jsonData.settings);
        
        // Transform settings to expected internal format
        // JSON format: [{setting: key1, waarde: value1}, {setting: key2, waarde: value2}, ...]
        // Internal format: [{key1: value1, key2: value2, ...}]
        let transformedSettings;
        if (Array.isArray(jsonData.settings) && jsonData.settings.length > 0) {
          // Check if settings are in the array-of-objects format
          if (jsonData.settings[0].setting !== undefined) {
            // Settings are in [{setting, waarde}] format - transform them
            // transformData returns [output], so it's already an array
            transformedSettings = transformData(jsonData.settings);
            // console.log('Transformed settings from array format:', transformedSettings);
          } else {
            // Settings are already in transformed format - wrap in array if needed
            transformedSettings = Array.isArray(jsonData.settings) ? jsonData.settings : [jsonData.settings];
            // console.log('Settings already in transformed format:', transformedSettings);
          }
        } else {
          throw new Error('Invalid settings format in JSON file');
        }
        
        // Store the data globally
        window.nodesGlobal = jsonData.nodes;
        window.links = jsonData.links;
        window.carriers = jsonData.carriers;
        window.legend = jsonData.carriers; // Keep both for compatibility
        window.settings = transformedSettings; // transformData already returns an array
        window.remarks = jsonData.remarks || [];
        
        // Update settingsGlobal used by D3 diagram
        if (typeof settingsGlobal !== 'undefined') {
          settingsGlobal = transformedSettings;
        }
        
        // Store original data for export purposes (keep in original array format)
        window.originalExcelData = {
          nodes: JSON.parse(JSON.stringify(jsonData.nodes)),
          links: JSON.parse(JSON.stringify(jsonData.links)),
          carriers: JSON.parse(JSON.stringify(jsonData.carriers)),
          settings: JSON.parse(JSON.stringify(jsonData.settings)),
          remarks: JSON.parse(JSON.stringify(jsonData.remarks || []))
        };
        
        // Store original links data for scale adjustments
        window.originalLinksData = JSON.parse(JSON.stringify(jsonData.links));
        
        // Create config object
        const config = {
          sankeyInstanceID: 'energyflows',
          targetDIV: 'SVGContainer_energyflows',
          settings: window.settings,
          carriers: jsonData.carriers,
          legend: jsonData.carriers,
          scenarios: []
        };
        
        window.currentSankeyConfig = config;
        
        // console.log('Data loaded successfully. Processing...');
        // console.log('Links sample:', jsonData.links[0]);
        // console.log('Nodes sample:', jsonData.nodes[0]);
        // console.log('Settings:', window.settings);
        // console.log('Config:', config);
        
        // Clear the existing SVG content before importing new data
        const existingSvg = document.querySelector('#energyflows_sankeySVGPARENT');
        if (existingSvg) {
          existingSvg.remove();
        }
        
        // Clear the container to force a fresh render
        const container = document.getElementById('SVGContainer_energyflows');
        if (container) {
          container.innerHTML = '';
        }
        
        // Reset sankey instances to avoid conflicts with old state
        if (typeof sankeyInstances !== 'undefined') {
          Object.keys(sankeyInstances).forEach(key => delete sankeyInstances[key]);
        }
        if (typeof window.sankeyInstances !== 'undefined') {
          Object.keys(window.sankeyInstances).forEach(key => delete window.sankeyInstances[key]);
        }
        if (typeof sankeyDataObject !== 'undefined') {
          sankeyDataObject = {links: [], nodes: []};
        }
        if (typeof window.sankeyDataObject !== 'undefined') {
          window.sankeyDataObject = {links: [], nodes: []};
        }
        
        // Set flag to disable transitions during import
        window.isImporting = true;
        
        // Process the data to render the diagram
        // Check for both global processData and window.processData
        const processFunc = typeof window.processData === 'function' ? window.processData : 
                           typeof processData === 'function' ? processData : null;
        
        if (processFunc) {
          // console.log('Calling processData...');
          
          try {
            processFunc(jsonData.links, jsonData.nodes, jsonData.carriers, window.settings, jsonData.remarks, config);
            // console.log('processData completed without errors');
            
            // Wait a bit for D3 to render the diagram, then check
            setTimeout(() => {
              // Check if sankeyDataObject was created
              if (window.sankeyDataObject) {
                // console.log('sankeyDataObject exists:', window.sankeyDataObject);
                // console.log('sankeyDataObject.nodes:', window.sankeyDataObject.nodes?.length);
                // console.log('sankeyDataObject.links:', window.sankeyDataObject.links?.length);
              } else {
                console.warn('sankeyDataObject was not created! (This is OK if the diagram renders)');
              }
              
              // Check if the SVG was created
              const svg = document.querySelector('#energyflows_sankeySVGPARENT');
              if (svg) {
                // console.log('SVG element found after delay:', svg);
                // console.log('SVG has children:', svg.children.length);
                
                // Check for actual diagram content
                const links = svg.querySelectorAll('.link');
                const nodes = svg.querySelectorAll('.node');
                // console.log('Links rendered:', links.length);
                // console.log('Nodes rendered:', nodes.length);
                
                if (links.length === 0 && nodes.length === 0) {
                  console.error('SVG exists but has no links or nodes! Diagram did not render properly.');
                  console.error('SVG innerHTML length:', svg.innerHTML.length);
                  console.error('First 500 chars of SVG:', svg.innerHTML.substring(0, 500));
                } else {
                  // console.log('✓ Diagram rendered successfully!');
                }
              } else {
                console.warn('SVG element not found after delay!');
              }
              
              // Scroll to top to ensure diagram is visible
              window.scrollTo(0, 0);
            }, 1000); // Wait 1 second for rendering
            
          } catch (processError) {
            console.error('Error in processData:', processError);
            throw processError;
          }
          
          // Update control panel with loaded settings
          setTimeout(() => {
            // console.log('Updating control panel with settings:', transformedSettings[0]);
            // transformedSettings is an array, pass the first element
            updateControlPanelFromSettings(transformedSettings[0]);
            // console.log('Generating legend color controls...');
            generateLegendColorControls();
            
            // Check node balance after import
            if (typeof window.checkNodeBalance === 'function') {
              window.checkNodeBalance();
            }
            // console.log('Control panel update complete');
          }, 500);
          
          // console.log('JSON import completed successfully');
          // alert('JSON file imported successfully!');
        } else {
          console.error('processData function not available');
          console.error('window.processData:', typeof window.processData);
          console.error('processData:', typeof processData);
          throw new Error('processData function not available. Make sure drawSankey.js is loaded.');
        }
        
      } catch (error) {
        console.error('Error importing JSON file:', error);
        alert('Failed to import JSON file: ' + error.message);
      }
    };
    
    reader.onerror = function(error) {
      console.error('Error reading file:', error);
      alert('Failed to read JSON file');
    };
    
    reader.readAsText(file);
  };
  
  // Trigger file selection
  input.click();
}

// ========================================
// YAML EXPORT/IMPORT FUNCTIONS
// ========================================

// YAML Export Function
function exportToYAML() {
  // console.log('=== YAML EXPORT STARTED ===');
  
  try {
    // Get current data with all modifications
    const currentNodes = window.nodesGlobal || (sankeyDataObject && sankeyDataObject.nodes ? sankeyDataObject.nodes : []);
    // IMPORTANT: Use originalLinksData for export to avoid D3-modified links with extra properties
    const rawLinks = window.originalLinksData || window.links;
    
    if (!currentNodes || !rawLinks) {
      alert('No data available to export');
      return;
    }
    
    // Map nodes to include all relevant properties
    const updatedNodes = currentNodes.map(node => ({
      id: node.id,
      title: node.title,
      x: node.x,
      y: node.y,
      direction: node.direction,
      labelposition: node.labelposition
    }));
    
    // Transform settings from internal format back to Excel format
    const settingsArray = [];
    if (window.settings && window.settings[0]) {
      const settingsObj = window.settings[0];
      
      // Get values from control panel inputs to ensure we have the latest
      const controlInputs = [
        { id: 'scaleDataValue', setting: 'scaleDataValue', type: 'number' },
        { id: 'scaleHeight', setting: 'scaleHeight', type: 'number' },
        { id: 'scaleCanvas', setting: 'scaleCanvas', type: 'number' },
        { id: 'canvasWidth', setting: 'canvasWidth', type: 'number' },
        { id: 'canvasHeight', setting: 'canvasHeight', type: 'number' },
        { id: 'diagramTitle', setting: 'title', type: 'text' },
        { id: 'titleFontSize', setting: 'titleFontSize', type: 'number' },
        { id: 'titlePositionX', setting: 'titlePositionX', type: 'number' },
        { id: 'titlePositionY', setting: 'titlePositionY', type: 'number' },
        { id: 'titleColor', setting: 'titleColor', type: 'text' },
        { id: 'backgroundColor', setting: 'backgroundColor', type: 'text' },
        { id: 'globalFlowOpacity', setting: 'globalFlowOpacity', type: 'number' },
        { id: 'nodeWidth', setting: 'nodeWidth', type: 'number' },
        { id: 'nodePadding', setting: 'nodePadding', type: 'number' },
        { id: 'nodeColor', setting: 'nodeColor', type: 'text' },
        { id: 'labelFontSize', setting: 'labelFontSize', type: 'number' },
        { id: 'labelFillColor', setting: 'labelFillColor', type: 'text' },
        { id: 'labelTextColor', setting: 'labelTextColor', type: 'text' },
        { id: 'labelBold', setting: 'labelBold', type: 'boolean' },
        { id: 'labelItalic', setting: 'labelItalic', type: 'boolean' },
        { id: 'valueFontSize', setting: 'valueFontSize', type: 'number' },
        { id: 'valueFillColor', setting: 'valueFillColor', type: 'text' },
        { id: 'valueBold', setting: 'valueBold', type: 'boolean' },
        { id: 'valueItalic', setting: 'valueItalic', type: 'boolean' },
        { id: 'showValueLabelsToggle', setting: 'showValueLabels', type: 'boolean' },
        { id: 'transparentBackgroundToggle', setting: 'transparentBackground', type: 'boolean' },
        { id: 'enableMouseInteractions', setting: 'enableMouseInteractions', type: 'boolean' },
        { id: 'unitSetting', setting: 'unit', type: 'text' },
        { id: 'decimalsRoundValues', setting: 'decimalsRoundValues', type: 'number' }
      ];
      
      // Build settings array
      controlInputs.forEach(input => {
        const element = document.getElementById(input.id);
        if (element) {
          let value = input.type === 'boolean' ? element.checked : element.value;
          // Convert string numbers to actual numbers for non-color, non-text fields
          if (input.type === 'number' && !isNaN(value) && value !== '') {
            value = parseFloat(value);
          }
          settingsArray.push({
            setting: input.setting,
            waarde: value
          });
        } else if (settingsObj[input.setting] !== undefined) {
          settingsArray.push({
            setting: input.setting,
            waarde: settingsObj[input.setting]
          });
        }
      });
    }
    
    // Prepare export data
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      nodes: updatedNodes,
      links: rawLinks,
      carriers: window.carriers || window.legend || [],
      settings: settingsArray,
      remarks: window.remarks || []
    };
    
    // Convert to YAML
    const yamlString = jsyaml.dump(exportData, {
      indent: 2,
      lineWidth: -1, // Don't wrap lines
      noRefs: true   // Don't use references
    });
    
    // Create and download file
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram_${new Date().toISOString().split('T')[0]}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // console.log('YAML export completed successfully');
    
  } catch (error) {
    console.error('Error exporting to YAML:', error);
    alert('Failed to export YAML file: ' + error.message);
  }
}

// YAML Import Function
function importYAMLFile() {
  // console.log('=== YAML IMPORT STARTED ===');
  
  // Create file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.yaml,.yml';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // console.log('File read successfully, parsing YAML data...');
        
        // Parse YAML
        const data = jsyaml.load(event.target.result);
        // console.log('YAML data parsed successfully:', data);
        
        if (!data.nodes || !data.links || !data.carriers) {
          throw new Error('Invalid YAML file: missing required data (nodes, links, or carriers)');
        }
        
        // Transform settings if needed
        let transformedSettings;
        // console.log('Settings format in YAML:', data.settings);
        
        if (Array.isArray(data.settings) && data.settings.length > 0 && data.settings[0].setting) {
          // Settings are in [{setting: key, waarde: value}] format, need to transform
          // console.log('Detected array format settings, transforming...');
          transformedSettings = transformData(data.settings);
          // console.log('Transformed settings from array format:', transformedSettings);
        } else if (Array.isArray(data.settings) && data.settings.length > 0) {
          // Settings are already in [{key: value}] format
          transformedSettings = data.settings;
        } else {
          // No settings or invalid format
          transformedSettings = [{}];
        }
        
        // Store in global variables
        window.nodesGlobal = data.nodes;
        window.links = data.links;
        window.carriers = data.carriers;
        window.legend = data.carriers; // Keep both for compatibility
        window.settings = transformedSettings;
        window.remarks = data.remarks || [];
        
        // Update settingsGlobal used by D3 diagram
        if (typeof settingsGlobal !== 'undefined') {
          settingsGlobal = transformedSettings;
        }
        
        // Store original data
        window.originalExcelData = {
          nodes: JSON.parse(JSON.stringify(data.nodes)),
          links: JSON.parse(JSON.stringify(data.links)),
          carriers: JSON.parse(JSON.stringify(data.carriers)),
          settings: JSON.parse(JSON.stringify(transformedSettings)),
          remarks: JSON.parse(JSON.stringify(data.remarks || []))
        };
        
        // Store original links separately for reset functionality
        window.originalLinksData = JSON.parse(JSON.stringify(data.links));
        
        // Create config object
        window.currentSankeyConfig = {
          sankeyInstanceID: 'energyflows',
          targetDIV: 'SVGContainer_energyflows',
          settings: transformedSettings,
          carriers: data.carriers,
          legend: data.carriers,
          remarks: data.remarks || []
        };
        
        // console.log('Data loaded successfully. Processing...');
        // console.log('Links sample:', data.links[0]);
        // console.log('Nodes sample:', data.nodes[0]);
        // console.log('Settings:', transformedSettings);
        // console.log('Config:', window.currentSankeyConfig);
        
        // Clear existing SVG content
        const existingSVG = document.getElementById('energyflows_sankeySVGPARENT');
        if (existingSVG) {
          existingSVG.remove();
        }
        
        // Clear the container
        const container = document.getElementById('SVGContainer_energyflows');
        if (container) {
          container.innerHTML = '';
        }
        
        // Reset sankey instances to avoid conflicts with old state
        if (typeof sankeyInstances !== 'undefined') {
          Object.keys(sankeyInstances).forEach(key => delete sankeyInstances[key]);
        }
        if (typeof window.sankeyInstances !== 'undefined') {
          Object.keys(window.sankeyInstances).forEach(key => delete window.sankeyInstances[key]);
        }
        if (typeof sankeyDataObject !== 'undefined') {
          sankeyDataObject = {links: [], nodes: []};
        }
        if (typeof window.sankeyDataObject !== 'undefined') {
          window.sankeyDataObject = {links: [], nodes: []};
        }
        
        // Set flag to disable transitions during import
        window.isImporting = true;
        
        // Call processData to render the diagram
        // console.log('Calling processData...');
        if (window.processData || typeof processData !== 'undefined') {
          const processFn = window.processData || processData;
          processFn(data.links, data.nodes, data.carriers, transformedSettings, data.remarks || [], window.currentSankeyConfig);
          // console.log('processData completed without errors');
          
          // Check if sankeyDataObject was created
          setTimeout(() => {
            if (window.sankeyDataObject) {
              // console.log('sankeyDataObject exists:', window.sankeyDataObject);
              // console.log('sankeyDataObject.nodes:', window.sankeyDataObject.nodes.length);
              // console.log('sankeyDataObject.links:', window.sankeyDataObject.links.length);
            } else {
              console.warn('sankeyDataObject was not created! (This is OK if the diagram renders)');
            }
            
            // Check if SVG was created and populated
            const svg = document.getElementById('energyflows_sankeySVGPARENT');
            if (svg) {
              // console.log('SVG element found after delay:', svg);
              // console.log('SVG has children:', svg.children.length);
              
              const links = svg.querySelectorAll('.link, .links path, path.link');
              const nodes = svg.querySelectorAll('.node, .nodes rect, rect.node');
              // console.log('Links rendered:', links.length);
              // console.log('Nodes rendered:', nodes.length);
              
              if (links.length === 0 && nodes.length === 0) {
                console.error('SVG exists but has no links or nodes! Diagram did not render properly.');
              } else {
                // console.log('✓ Diagram rendered successfully!');
              }
              // console.log('SVG innerHTML length:', svg.innerHTML.length);
              // console.log('First 500 chars of SVG:', svg.innerHTML.substring(0, 500));
            } else {
              // console.error('SVG element not found after delay!');
            }
          }, 1000);
          
          // Update control panel and legend
          setTimeout(() => {
            // console.log('Updating control panel with settings:', transformedSettings[0]);
            updateControlPanelFromSettings(transformedSettings[0]);
            // console.log('Generating legend color controls...');
            generateLegendColorControls();
            
            // Check node balance after import
            if (typeof window.checkNodeBalance === 'function') {
              window.checkNodeBalance();
            }
            // console.log('Control panel update complete');
          }, 500);
          
          // Scroll to top
          window.scrollTo(0, 0);
          
          // console.log('YAML import completed successfully');
          alert('YAML file imported successfully!');
        } else {
          console.error('processData function not available');
          throw new Error('processData function not available. Make sure drawSankey.js is loaded.');
        }
        
      } catch (error) {
        console.error('Error importing YAML file:', error);
        alert('Failed to import YAML file: ' + error.message);
      }
    };
    
    reader.onerror = function(error) {
      console.error('Error reading file:', error);
      alert('Failed to read YAML file');
    };
    
    reader.readAsText(file);
  };
  
  // Trigger file selection
  input.click();
}

// Make YAML functions globally available
window.exportToYAML = exportToYAML;
window.importYAMLFile = importYAMLFile;

// Helper function to update control panel from settings
function updateControlPanelFromSettings(settings) {
  if (!settings) return;
  
  const controlPanelInputs = [
    { id: 'scaleDataValue', setting: 'scaleDataValue', type: 'number' },
    { id: 'scaleHeight', setting: 'scaleHeight', type: 'number' },
    { id: 'scaleCanvas', setting: 'scaleCanvas', type: 'number' },
    { id: 'canvasWidth', setting: 'canvasWidth', type: 'number' },
    { id: 'canvasHeight', setting: 'canvasHeight', type: 'number' },
    { id: 'diagramTitle', setting: 'title', type: 'text' },
    { id: 'titleFontSize', setting: 'titleFontSize', type: 'number' },
    { id: 'titlePositionX', setting: 'titlePositionX', type: 'number' },
    { id: 'titlePositionY', setting: 'titlePositionY', type: 'number' },
    { id: 'titleColor', setting: 'titleColor', type: 'text' },
    { id: 'backgroundColor', setting: 'backgroundColor', type: 'text' },
    { id: 'nodeWidth', setting: 'nodeWidth', type: 'number' },
    { id: 'nodeColor', setting: 'nodeColor', type: 'text' },
    { id: 'labelFillColor', setting: 'labelFillColor', type: 'text' },
    { id: 'labelTextColor', setting: 'labelTextColor', type: 'text' },
    { id: 'showValueLabelsToggle', setting: 'showValueLabels', type: 'boolean' },
    { id: 'transparentBackgroundToggle', setting: 'transparentBackground', type: 'boolean' },
    { id: 'unitSetting', setting: 'unit', type: 'text' },
    { id: 'decimalsRoundValues', setting: 'decimalsRoundValues', type: 'number' },
    { id: 'globalFlowOpacity', setting: 'globalFlowOpacity', type: 'number' },
    { id: 'nodePadding', setting: 'nodePadding', type: 'number' },
    { id: 'labelFontSize', setting: 'labelFontSize', type: 'number' },
    { id: 'labelBold', setting: 'labelBold', type: 'boolean' },
    { id: 'labelItalic', setting: 'labelItalic', type: 'boolean' },
    { id: 'valueFontSize', setting: 'valueFontSize', type: 'number' },
    { id: 'valueFillColor', setting: 'valueFillColor', type: 'text' },
    { id: 'valueBold', setting: 'valueBold', type: 'boolean' },
    { id: 'valueItalic', setting: 'valueItalic', type: 'boolean' }
  ];
  
  // console.log('Applying settings to control panel:', settings);
  
  controlPanelInputs.forEach(input => {
    const element = document.getElementById(input.id);
    if (!element) {
      console.log(`Control element not found: ${input.id}`);
      return;
    }
    
    const value = settings[input.setting];
    if (value === undefined || value === null) {
      console.log(`No value for setting: ${input.setting}`);
      return;
    }
    
    // console.log(`Setting ${input.id} (${input.setting}) to: ${value}`);
    
    if (input.type === 'boolean') {
      const boolValue = (value === 'Yes' || value === true || value === 'true');
      element.checked = boolValue;
      // Dispatch change event to trigger any onchange handlers
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.value = value;
      // Dispatch input and change events to trigger any handlers
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  // console.log('Control panel settings applied');
}

// Helper function to update worksheet while preserving original structure
function updateWorksheetPreservingStructure(worksheet, newData, sheetType) {
  // console.log(`Updating ${sheetType} sheet while preserving structure`);
  
  if (!worksheet['!ref']) {
    console.warn(`No range found in original ${sheetType} sheet`);
    return;
  }

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Find header row by looking for typical column names
  let headerRow = -1;
  let headers = {};
  
  // Look for header row in first few rows
  // console.log(`Looking for header row in ${sheetType} sheet...`);
  for (let row = 0; row <= Math.min(5, range.e.r); row++) {
    const firstCellAddr = XLSX.utils.encode_cell({r: row, c: 0});
    const firstCell = worksheet[firstCellAddr];
    
    if (firstCell && firstCell.v) {
      const cellValue = firstCell.v.toString().toLowerCase();
      // console.log(`Row ${row}, first cell: "${cellValue}"`);
      
      // Check if this looks like a header row for the sheet type
      if (sheetType === 'links' && (cellValue === 'source' || cellValue === 'from' || cellValue.includes('source') || cellValue === 'source.id')) {
        headerRow = row;
        // console.log(`Found links header at row ${row}: "${cellValue}"`);
        break;
      } else if (sheetType === 'nodes' && (cellValue === 'id' || cellValue === 'node' || cellValue.includes('id'))) {
        headerRow = row;
        // console.log(`Found nodes header at row ${row}: "${cellValue}"`);
        break;
      }
    }
  }
  
  // If still not found, try looking at more cells in the first few rows
  if (headerRow === -1) {
    // console.log(`Header not found in first column, checking other columns...`);
    for (let row = 0; row <= Math.min(5, range.e.r); row++) {
      let rowHeaders = [];
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cellAddr = XLSX.utils.encode_cell({r: row, c: col});
        const cell = worksheet[cellAddr];
        if (cell && cell.v) {
          rowHeaders.push(cell.v.toString());
        }
      }
      // console.log(`Row ${row} headers:`, rowHeaders);
      
      // Check if this row contains typical headers
      const rowHeadersLower = rowHeaders.map(h => h.toLowerCase());
      if (sheetType === 'links' && (rowHeadersLower.includes('source') || rowHeadersLower.includes('source.id') || rowHeadersLower.includes('from'))) {
        headerRow = row;
        // console.log(`Found links header row at ${row} based on column headers`);
        break;
      } else if (sheetType === 'nodes' && (rowHeadersLower.includes('id') || rowHeadersLower.includes('title') || rowHeadersLower.includes('name'))) {
        headerRow = row;
        // console.log(`Found nodes header row at ${row} based on column headers`);
        break;
      }
    }
  }
  
  if (headerRow === -1) {
    console.warn(`Could not find header row in ${sheetType} sheet - will create new sheet instead`);
    return false; // Signal that structure preservation failed
  }
  
  // console.log(`Found header row at ${headerRow} for ${sheetType}`);
  
  // Map column headers to column indices
  for (let col = 0; col <= range.e.c; col++) {
    const headerAddr = XLSX.utils.encode_cell({r: headerRow, c: col});
    const headerCell = worksheet[headerAddr];
    
    if (headerCell && headerCell.v) {
      const headerName = headerCell.v.toString().toLowerCase().trim();
      headers[headerName] = col;
    }
  }
  
  // console.log(`Found headers:`, Object.keys(headers));
  
  // First pass: identify which rows originally had data
  const originalDataRows = [];
  
  for (let row = headerRow + 1; row <= range.e.r; row++) {
    let hasData = false;
    
    // Check key columns to determine if this row has data
    if (sheetType === 'links') {
      const sourceCol = headers['source'] || headers['from'];
      const targetCol = headers['target'] || headers['to'];
      
      if (sourceCol !== undefined) {
        const sourceCellAddr = XLSX.utils.encode_cell({r: row, c: sourceCol});
        const sourceCell = worksheet[sourceCellAddr];
        if (sourceCell && sourceCell.v && sourceCell.v.toString().trim() !== '') {
          hasData = true;
        }
      }
      
      if (!hasData && targetCol !== undefined) {
        const targetCellAddr = XLSX.utils.encode_cell({r: row, c: targetCol});
        const targetCell = worksheet[targetCellAddr];
        if (targetCell && targetCell.v && targetCell.v.toString().trim() !== '') {
          hasData = true;
        }
      }
    } else if (sheetType === 'nodes') {
      const idCol = headers['id'] || headers['node'];
      
      if (idCol !== undefined) {
        const idCellAddr = XLSX.utils.encode_cell({r: row, c: idCol});
        const idCell = worksheet[idCellAddr];
        if (idCell && idCell.v && idCell.v.toString().trim() !== '') {
          hasData = true;
        }
      }
    }
    
    if (hasData) {
      originalDataRows.push(row);
    }
  }
  
  // console.log(`Found ${originalDataRows.length} rows with original data in ${sheetType} sheet`);
  
  // Second pass: clear only the rows that had data, preserve empty rows
  originalDataRows.forEach(row => {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({r: row, c: col});
      if (worksheet[cellAddr]) {
        delete worksheet[cellAddr];
      }
    }
  });
  
  // Third pass: write new data to the original data row positions
  let currentDataIndex = 0;
  
  originalDataRows.forEach(row => {
    if (currentDataIndex < newData.length) {
      const rowData = newData[currentDataIndex];
      writeDataToRow(worksheet, rowData, row, headers);
      currentDataIndex++;
    }
  });
  
  // If we have more data than original rows, extend the sheet
  let nextRow = range.e.r + 1;
  while (currentDataIndex < newData.length) {
    const rowData = newData[currentDataIndex];
    writeDataToRow(worksheet, rowData, nextRow, headers);
    nextRow++;
    currentDataIndex++;
  }
  
  // Update sheet range if we extended it
  if (nextRow > range.e.r + 1) {
    worksheet['!ref'] = XLSX.utils.encode_range({
      s: {r: range.s.r, c: range.s.c},
      e: {r: nextRow - 1, c: range.e.c}
    });
  }
  
  // console.log(`Updated ${sheetType} sheet: wrote ${newData.length} data items, preserved original structure`);
  return true; // Signal successful structure preservation
}

// Helper function to write data to a specific row
function writeDataToRow(worksheet, rowData, rowIndex, headers) {
  Object.keys(rowData).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    const colIndex = headers[normalizedKey];
    
    if (colIndex !== undefined) {
      const cellAddr = XLSX.utils.encode_cell({r: rowIndex, c: colIndex});
      const cellValue = rowData[key];
      
      if (cellValue !== undefined && cellValue !== null) {
        worksheet[cellAddr] = {
          v: cellValue,
          t: typeof cellValue === 'number' ? 'n' : 's'
        };
      }
    }
  });
}

// Function to trigger Excel file import
function importExcelFile() {
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) {
    fileInput.click(); // Trigger file selection dialog
  }
}

// Helper function to update UI inputs with imported values
// Function to handle Excel file import (make globally accessible)
window.handleExcelImport = function handleExcelImport(event, isDragDrop = false) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // console.log('=== EXCEL IMPORT DEBUG ===');
  // console.log('Selected file:', file.name, 'Size:', file.size, 'bytes');
  // console.log('Import source:', isDragDrop ? 'Drag & Drop' : 'Button Click');
  
  // Store the original filename globally for use in export
  window.originalFilename = file.name;

  // Validate file type
  const validExtensions = ['.xlsx', '.xls'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!validExtensions.includes(fileExtension)) {
    alert('Please select a valid Excel file (.xlsx or .xls)');
    return;
  }

  // Show loading state (only for button clicks, not drag-and-drop)
  let importButton, originalText;
  if (!isDragDrop) {
    importButton = document.getElementById('importExcelButton');
    originalText = importButton.innerHTML;
    importButton.innerHTML = `
       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10"></circle>
         <polyline points="12,6 12,12 16,14"></polyline>
       </svg>
       Loading...
  `;
    importButton.disabled = true;
  } else {
    // console.log('Skipping button state change for drag-and-drop import');
  }

  // Create FileReader to read the Excel file
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      // console.log('File read successfully, parsing Excel data...');

      // Parse Excel file
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // console.log('Excel workbook parsed, sheet names:', workbook.SheetNames);

      // Store the complete original workbook for export purposes
      window.originalWorkbook = workbook;

      // Extract data from expected sheets
      let links = [];
      let nodes = [];
      let legend = [];
      let settings = [];
      let remarks = [];

      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        switch (sheetName.toLowerCase()) {
          case 'links':
            links = XLSX.utils.sheet_to_json(worksheet);
            // console.log('Loaded links:', links.length, 'entries');
            break;
          case 'nodes':
            nodes = XLSX.utils.sheet_to_json(worksheet);
            // console.log('Loaded nodes:', nodes.length, 'entries');
            break;
          case 'carriers':
            legend = XLSX.utils.sheet_to_json(worksheet);
            // console.log('Loaded carriers:', legend.length, 'entries');
            break;
          case 'settings':
            settings = XLSX.utils.sheet_to_json(worksheet);
            // console.log('Loaded settings:', settings.length, 'entries');
            break;
          case 'remarks':
            remarks = XLSX.utils.sheet_to_json(worksheet);
            // console.log('Loaded remarks:', remarks.length, 'entries');
            break;
          default:
            // console.log(`Sheet '${sheetName}' will be preserved but not processed`);
        }
      });

      // Validate required data
      if (links.length === 0 || nodes.length === 0 || settings.length === 0) {
        throw new Error('Missing required sheets: links, nodes, or settings');
      }

      // Transform settings to expected format
      const transformedSettings = transformData(settings);
      // console.log('Transformed settings sample:', transformedSettings[0]);
      // console.log('Settings keys:', Object.keys(transformedSettings[0] || {}));

      // Validate required settings and add defaults if missing
      if (transformedSettings[0]) {
        // Add default values for required settings if they're missing
        if (!transformedSettings[0].backgroundColor) {
          transformedSettings[0].backgroundColor = '#FFFFFF';
          // console.log('Added default backgroundColor');
        }
        if (!transformedSettings[0].canvasWidth) {
          transformedSettings[0].canvasWidth = 1600;
          // console.log('Added default canvasWidth');
        }
        if (!transformedSettings[0].canvasHeight) {
          transformedSettings[0].canvasHeight = 1200;
          // console.log('Added default canvasHeight');
        }
        if (!transformedSettings[0].title) {
          transformedSettings[0].title = 'Sankey Diagram';
          // console.log('Added default title');
        }
        if (!transformedSettings[0].scaleInit) {
          transformedSettings[0].scaleInit = 1;
          // console.log('Added default scaleInit');
        }
        if (!transformedSettings[0].scaleDataValue) {
          transformedSettings[0].scaleDataValue = 1;
          // console.log('Added default scaleDataValue');
        }
        if (!transformedSettings[0].scaleDataValueCO2flow) {
          transformedSettings[0].scaleDataValueCO2flow = 1;
          // console.log('Added default scaleDataValueCO2flow');
        }
        if (!transformedSettings[0].scaleHeight) {
          transformedSettings[0].scaleHeight = 1;
          // console.log('Added default scaleHeight');
        }
        if (!transformedSettings[0].horizontalMargin) {
          transformedSettings[0].horizontalMargin = 50;
          // console.log('Added default horizontalMargin');
        }
        if (!transformedSettings[0].verticalMargin) {
          transformedSettings[0].verticalMargin = 80;
          // console.log('Added default verticalMargin');
        }
        if (!transformedSettings[0].titleFontSize) {
          transformedSettings[0].titleFontSize = 24;
          // console.log('Added default titleFontSize');
        }
        if (!transformedSettings[0].titlePositionX) {
          transformedSettings[0].titlePositionX = 50;
          // console.log('Added default titlePositionX');
        }
        if (!transformedSettings[0].titlePositionY) {
          transformedSettings[0].titlePositionY = 40;
          // console.log('Added default titlePositionY');
        }
        if (!transformedSettings[0].nodeColor) {
          transformedSettings[0].nodeColor = '#555555';
          // console.log('Added default nodeColor');
        }
        if (!transformedSettings[0].adaptTotalHeight) {
          transformedSettings[0].adaptTotalHeight = 1;
          // console.log('Added default adaptTotalHeight');
        }
        if (!transformedSettings[0].labelFillColor) {
          transformedSettings[0].labelFillColor = '#FFFFFF';
          // console.log('Added default labelFillColor');
        }
         if (!transformedSettings[0].labelTextColor) {
           transformedSettings[0].labelTextColor = '#000000';
          //  console.log('Added default labelTextColor');
         }
         if (!transformedSettings[0].showValueLabels) {
           transformedSettings[0].showValueLabels = 'Yes';
          //  console.log('Added default showValueLabels');
         }
         if (!transformedSettings[0].globalFlowOpacity) {
           transformedSettings[0].globalFlowOpacity = 0.9;
          //  console.log('Added default globalFlowOpacity');
         }
         if (!transformedSettings[0].decimalsRoundValues && transformedSettings[0].decimalsRoundValues !== 0) {
           transformedSettings[0].decimalsRoundValues = 1;
          //  console.log('Added default decimalsRoundValues');
         }
        }

      // console.log('Final transformed settings:', transformedSettings[0]);

      // Clear existing diagram and reset global state
      // IMPORTANT: Remove the entire SVG element, not just its contents
      // This ensures D3 doesn't try to update old elements with stale data
      const existingSVG = document.getElementById('energyflows_sankeySVGPARENT');
      if (existingSVG) {
        existingSVG.remove();
      }
      
      // Clear the main container
      d3.select('#sankeyContainer_main').html('');

      // Reset sankey instances to avoid conflicts
      // Force reset by accessing the global variable directly
      if (typeof sankeyInstances !== 'undefined') {
        // Clear all properties from the object
        Object.keys(sankeyInstances).forEach(key => delete sankeyInstances[key]);
      }
      if (typeof window.sankeyInstances !== 'undefined') {
        Object.keys(window.sankeyInstances).forEach(key => delete window.sankeyInstances[key]);
      }
      
      // Also reset the sankeyDataObject to ensure clean state
      if (typeof sankeyDataObject !== 'undefined') {
        sankeyDataObject = {links: [], nodes: []};
      }
      if (typeof window.sankeyDataObject !== 'undefined') {
        window.sankeyDataObject = {links: [], nodes: []};
      }

      // Create the container structure that the sankey expects
      const sankeyContainer = d3.select('#sankeyContainer_main')
        .append('div')
        .attr('id', 'SVGContainer_energyflows')
        .style('width', '100%')
        .style('height', '1200px');

      // Create config for the new data
      const config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        width: 1600,
        height: 1200,
        settings: transformedSettings,
        legend: legend,
        sankeyDataID: '' // Use empty string to match the updated generateSankeyLibrary
      };

      // console.log('Created config:', {
      //   sankeyInstanceID: config.sankeyInstanceID,
      //   targetDIV: config.targetDIV,
      //   settingsCount: config.settings.length,
      //   legendCount: config.legend.length,
      //   hasSettings: !!config.settings[0],
      //   settingsKeys: config.settings[0] ? Object.keys(config.settings[0]).slice(0, 5) : []
      // });

      // Store data globally before processing
      window.currentSankeyConfig = config;
      window.nodesGlobal = nodes;
      window.links = links;
      window.legend = legend;
      window.settings = transformedSettings;
      window.remarks = remarks;
      
      // Update settingsGlobal used by D3 diagram
      if (typeof settingsGlobal !== 'undefined') {
        settingsGlobal = transformedSettings;
      }

      // Store original unscaled links data
      window.originalLinksData = JSON.parse(JSON.stringify(links));

      // Process and render the new data using the proper processData function
      // console.log('Processing imported data...');
      // console.log('Data summary:', {
      //   links: links.length,
      //   nodes: nodes.length,
      //   legend: legend.length,
      //   settings: transformedSettings.length,
      //   remarks: remarks.length
      // });

      // Debug: Check the structure of the imported data
      // console.log('Sample data structures:');
      if (links.length > 0) {
        // console.log('Links sample:', links[0]);
        // console.log('Links keys:', Object.keys(links[0]));
      }
      if (nodes.length > 0) {
        // console.log('Nodes sample:', nodes[0]);
        // console.log('Nodes keys:', Object.keys(nodes[0]));
      }
      if (legend.length > 0) {
        // console.log('Legend sample:', legend[0]);
        // console.log('Legend keys:', Object.keys(legend[0]));
      }

      // Set a flag to disable problematic event handlers during import
      window.disableMouseEvents = true;
      
      // Set flag to disable transitions during import (prevents interpolation errors)
      window.isImporting = true;

      // Reset the selection buttons flag to ensure they get initialized
      if (typeof selectionButtonsHaveInitialized !== 'undefined') {
        selectionButtonsHaveInitialized = false;
        // console.log('Reset selectionButtonsHaveInitialized to false');
      }

      try {
        // Debug: Check if target div exists
        const targetDiv = document.getElementById(config.targetDIV);
        // console.log('Target DIV check:', {
        //   targetDIV: config.targetDIV,
        //   divExists: !!targetDiv,
        //   divWidth: targetDiv ? targetDiv.offsetWidth : 'N/A',
        //   divHeight: targetDiv ? targetDiv.offsetHeight : 'N/A'
        // });

        // Use processData function exactly like the normal loading flow
        if (typeof processData === 'function') {
          // console.log('Using global processData function');
          // console.log('Calling processData with:', {
          //   linksCount: links.length,
          //   nodesCount: nodes.length,
          //   legendCount: legend.length,
          //   settingsCount: transformedSettings.length,
          //   remarksCount: remarks.length,
          //   configKeys: Object.keys(config)
          // });

          processData(links, nodes, legend, transformedSettings, remarks, config);
          // console.log('processData call completed');

        } else if (window.processData) {
          // console.log('Using window.processData function');
          window.processData(links, nodes, legend, transformedSettings, remarks, config);
          // console.log('window.processData call completed');

        } else {
          throw new Error('processData function not available');
        }

        // Check what was created after processData
        setTimeout(() => {
          // console.log('Post-processData check:', {
          //   sankeyDataObject: !!window.sankeyDataObject,
          //   sankeyDataObjectKeys: window.sankeyDataObject ? Object.keys(window.sankeyDataObject) : 'N/A',
          //   sankeyInstances: !!window.sankeyInstances,
          //   sankeyInstancesKeys: window.sankeyInstances ? Object.keys(window.sankeyInstances) : 'N/A',
          //   svgExists: !!document.querySelector('#' + config.sankeyInstanceID + '_sankeySVGPARENT'),
          //   sankeyGroupExists: !!document.querySelector('#' + config.sankeyInstanceID)
          // });

          // Check if any SVG elements were created
          const allSVGs = document.querySelectorAll('svg');
          // console.log('All SVG elements found:', allSVGs.length);
          allSVGs.forEach((svg, index) => {
            // console.log(`SVG ${index}:`, {
            //   id: svg.id,
            //   width: svg.getAttribute('width'),
            //   height: svg.getAttribute('height'),
            //   childCount: svg.children.length
            // });
          });

          // Check specifically for the sankey SVG and its content
          const sankeySVG = document.querySelector('#energyflows_sankeySVGPARENT');
          if (sankeySVG) {
            // console.log('Sankey SVG details:', {
            //   width: sankeySVG.getAttribute('width'),
            //   height: sankeySVG.getAttribute('height'),
            //   viewBox: sankeySVG.getAttribute('viewBox'),
            //   backgroundColor: sankeySVG.style.backgroundColor,
            //   childrenCount: sankeySVG.children.length,
            //   visible: sankeySVG.style.display !== 'none',
            //   opacity: sankeySVG.style.opacity || '1'
            // });

            // Check for sankey-specific elements
            const nodes = sankeySVG.querySelectorAll('.node');
            const links = sankeySVG.querySelectorAll('.link');
            const title = sankeySVG.querySelector('#diagramTitle');

            // console.log('Sankey content check:', {
            //   nodesFound: nodes.length,
            //   linksFound: links.length,
            //   titleFound: !!title,
            //   titleText: title ? title.textContent : 'N/A'
            // });

            // Check if nodes and links have proper positioning
            if (nodes.length > 0) {
              // console.log('First node sample:', {
              //   transform: nodes[0].getAttribute('transform'),
              //   width: nodes[0].querySelector('rect')?.getAttribute('width'),
              //   height: nodes[0].querySelector('rect')?.getAttribute('height')
              // });
            }

            if (links.length > 0) {
              // console.log('First link sample:', {
              //   d: links[0].getAttribute('d')?.substring(0, 50) + '...',
              //   stroke: links[0].getAttribute('stroke'),
              //   strokeWidth: links[0].getAttribute('stroke-width')
              // });
            }
          } else {
            // console.log('❌ Sankey SVG not found!');
          }

        }, 1000);

        // console.log('processData completed successfully');

        // Re-enable mouse events after a delay
        setTimeout(() => {
          window.disableMouseEvents = false;
          // console.log('Mouse events re-enabled after import');
        }, 3000);

      } catch (processError) {
        console.error('Error in processData:', processError.message);
        console.error('Full processData error:', processError);
        console.error('Error stack:', processError.stack);

        // Re-enable mouse events even on error
        setTimeout(() => {
          window.disableMouseEvents = false;
        }, 1000);

        throw new Error(`processData failed: ${processError.message}`);
      }

      // Update UI inputs with new values after rendering is complete
      setTimeout(() => {
        updateUIInputs(transformedSettings[0]);

        // Generate legend color controls after import
        generateLegendColorControls();

        // Check for offscreen nodes after import
        if (window.currentSankeyConfig) {
          setTimeout(() => {
            // console.log('Checking for offscreen nodes after import...');
            if (typeof checkOffscreenNodes === 'function') {
              checkOffscreenNodes(window.currentSankeyConfig);
            }
          }, 200);

        // Apply nodeWidth setting from Excel import
        setTimeout(() => {
          if (transformedSettings[0] && transformedSettings[0].nodeWidth) {
            const nodeWidth = transformedSettings[0].nodeWidth;
            // console.log('Applying nodeWidth from Excel import:', nodeWidth);
            
            const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
            if (sankeyDiagram) {
              const nodeRects = sankeyDiagram.querySelectorAll('.nodes .node .node-click-target');
              nodeRects.forEach(rect => {
                rect.setAttribute('width', nodeWidth);
              });
              // console.log(`Applied nodeWidth ${nodeWidth} to ${nodeRects.length} nodes after Excel import`);
            }
          }
        }, 250); // Apply after offscreen check but before balance check

        // Apply showValueLabels setting from Excel import
        setTimeout(() => {
          if (transformedSettings[0]) {
            const showValueLabelsSetting = transformedSettings[0].showValueLabels || 'Yes';
            // console.log('Applying showValueLabels from Excel import:', showValueLabelsSetting);
            
            const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
            if (sankeyDiagram) {
              const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-value');
              const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
              
              valueLabels.forEach(label => {
                const nodeElement = label.closest('.node');
                if (nodeElement && nodeElement.__data__) {
                  const nodeName = nodeElement.__data__.title || '';
                  if (nodeName.startsWith('.')) {
                    label.style.display = 'none';
                  } else {
                    label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                } else {
                  label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                }
              });

              valueLabelsBackdrop.forEach(backdrop => {
                const nodeElement = backdrop.closest('.node');
                if (nodeElement && nodeElement.__data__) {
                  const nodeName = nodeElement.__data__.title || '';
                  if (nodeName.startsWith('.')) {
                    backdrop.style.display = 'none';
                  } else {
                    backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                } else {
                  backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                }
              });
              // console.log(`Applied showValueLabels ${showValueLabelsSetting} to ${valueLabels.length} labels and backdrops after Excel import`);
            }
          }
        }, 600); // Apply after other settings to ensure it takes effect

        // Apply globalFlowOpacity setting from Excel import
        setTimeout(() => {
          if (transformedSettings[0] && transformedSettings[0].globalFlowOpacity !== undefined) {
            const flowOpacity = transformedSettings[0].globalFlowOpacity;
            // console.log('Applying globalFlowOpacity from Excel import:', flowOpacity);
            
            const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
            if (sankeyDiagram) {
              const flows = sankeyDiagram.querySelectorAll('.links .link path');
              flows.forEach(flow => {
                flow.style.opacity = flowOpacity;
              });
              // console.log(`Applied flowOpacity ${flowOpacity} to ${flows.length} flows after Excel import`);
            }
          }
        }, 700); // Apply after showValueLabels

        // Check node balance after import
        setTimeout(() => {
          if (typeof window.checkNodeBalance === 'function') {
            // console.log('Running initial node balance check...');
            window.checkNodeBalance();
          }
        }, 300); // Run after offscreen check
        
        // Ensure event handlers are attached after import
        setTimeout(() => {
          if (typeof window.debugAttachEventListeners === 'function') {
            // console.log('Reattaching event handlers after import...');
            window.debugAttachEventListeners();
          }
        }, 500); // Run after balance check to ensure diagram is ready
        }
      }, 1000); // Longer delay to ensure sankey is fully rendered

      // console.log('✓ Excel file imported successfully');

      // Show success state after a short delay
      setTimeout(() => {
        // Update button to show success (only for button clicks)
        if (!isDragDrop) {
          importButton.innerHTML = `
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="20,6 9,17 4,12"></polyline>
             </svg>
             Imported!
           `;
        } else {
          // console.log('Excel file imported successfully via drag-and-drop');
        }

        if (!isDragDrop) {
          setTimeout(() => {
            importButton.innerHTML = originalText;
            importButton.disabled = false;
          }, 2000);
        }
      }, 1200); // Wait for rendering to complete

    } catch (error) {
      console.error('Error importing Excel file:', error.message);
      console.error('Full import error:', error);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to import Excel file';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }

      alert(errorMessage);

      // Reset button state (only for button clicks)
      if (!isDragDrop) {
        importButton.innerHTML = originalText;
        importButton.disabled = false;
      }
    }
  };

  reader.onerror = function () {
    console.error('Error reading file');
    alert('Error reading the selected file');

    // Reset button state (only for button clicks)
    if (!isDragDrop) {
      importButton.innerHTML = originalText;
      importButton.disabled = false;
    }
  };

  // Read the file
  reader.readAsArrayBuffer(file);

  // Clear the input so the same file can be selected again if needed (only for real file inputs)
  if (event.target && event.target.value !== undefined) {
    event.target.value = '';
  }
};

// Helper function to transform settings data (same as in fileLoadButton.js)
function transformData(inputArray) {
  const output = {};
  inputArray.forEach(item => {
    const key = item.setting;
    const value = item.waarde;
    output[key] = value;
  });
  return [output];
}

function updateUIInputs(settings) {
  // console.log('Updating UI inputs with imported settings:', settings);

  // Update title input
  const titleInput = document.getElementById('diagramTitle');
  if (titleInput && settings.title) {
    titleInput.value = settings.title;
  }

  // Update scale data value input
  const scaleInput = document.getElementById('scaleDataValue');
  if (scaleInput && settings.scaleDataValue) {
    scaleInput.value = settings.scaleDataValue;
  }

  // Update scale height input
  const scaleHeightInput = document.getElementById('scaleHeight');
  if (scaleHeightInput && settings.scaleHeight) {
    scaleHeightInput.value = settings.scaleHeight;
  }

  // Update scale canvas input
  const scaleCanvasInput = document.getElementById('scaleCanvas');
  if (scaleCanvasInput && settings.scaleCanvas) {
    scaleCanvasInput.value = settings.scaleCanvas;
    // Apply the canvas scale
    if (window.currentSankeyConfig) {
      applyCanvasScale(settings.scaleCanvas, window.currentSankeyConfig);
    }
  } else if (scaleCanvasInput) {
    scaleCanvasInput.value = 1.0;
  }

  // Update scroll extent width input
  const scrollWidthInput = document.getElementById('canvasWidth');
  if (scrollWidthInput && settings.canvasWidth) {
    scrollWidthInput.value = settings.canvasWidth;
  } else if (scrollWidthInput) {
    // Set default value if no setting provided
    scrollWidthInput.value = 1600;
  }

  // Update scroll extent height input
  const scrollHeightInput = document.getElementById('canvasHeight');
  if (scrollHeightInput && settings.canvasHeight) {
    scrollHeightInput.value = settings.canvasHeight;
  } else if (scrollHeightInput) {
    // Set default value if no setting provided
    scrollHeightInput.value = 1200;
  }

  // Update title font size input
  const titleFontSizeInput = document.getElementById('titleFontSize');
  if (titleFontSizeInput && settings.titleFontSize) {
    titleFontSizeInput.value = settings.titleFontSize;
  } else if (titleFontSizeInput) {
    titleFontSizeInput.value = 24;
  }

  // Update title position X input
  const titlePositionXInput = document.getElementById('titlePositionX');
  if (titlePositionXInput && settings.titlePositionX) {
    titlePositionXInput.value = settings.titlePositionX;
  } else if (titlePositionXInput) {
    titlePositionXInput.value = 50;
  }

  // Update title position Y input
  const titlePositionYInput = document.getElementById('titlePositionY');
  if (titlePositionYInput && settings.titlePositionY) {
    titlePositionYInput.value = settings.titlePositionY;
  } else if (titlePositionYInput) {
    titlePositionYInput.value = 40;
  }

  // Update title color input
  const titleColorInput = document.getElementById('titleColor');
  if (titleColorInput && settings.titleColor) {
    titleColorInput.value = settings.titleColor;
  } else if (titleColorInput) {
    titleColorInput.value = '#000000'; // Default to black
  }

  // Update background color input
  const backgroundColorInput = document.getElementById('backgroundColor');
  if (backgroundColorInput && settings.backgroundColor) {
    backgroundColorInput.value = settings.backgroundColor;
  } else if (backgroundColorInput) {
    backgroundColorInput.value = '#FFFFFF';
  }

    // Update node color input
    const nodeColorInput = document.getElementById('nodeColor');
    if (nodeColorInput && settings.nodeColor) {
      nodeColorInput.value = settings.nodeColor;
    } else if (nodeColorInput) {
      nodeColorInput.value = '#555555';
    }

    // Update node width input
    const nodeWidthInput = document.getElementById('nodeWidth');
    if (nodeWidthInput && settings.nodeWidth) {
      nodeWidthInput.value = settings.nodeWidth;
    } else if (nodeWidthInput) {
      nodeWidthInput.value = 15; // Default value
    }

  // Update label fill color input
  const labelFillColorInput = document.getElementById('labelFillColor');
  if (labelFillColorInput && settings.labelFillColor) {
    labelFillColorInput.value = settings.labelFillColor;
  } else if (labelFillColorInput) {
    labelFillColorInput.value = '#FFFFFF';
  }

   // Update label text color input
   const labelTextColorInput = document.getElementById('labelTextColor');
   if (labelTextColorInput && settings.labelTextColor) {
     labelTextColorInput.value = settings.labelTextColor;
   } else if (labelTextColorInput) {
     labelTextColorInput.value = '#000000';
   }

   // Update show value labels toggle
   const showValueLabelsToggle = document.getElementById('showValueLabelsToggle');
   if (showValueLabelsToggle && settings.showValueLabels) {
     showValueLabelsToggle.checked = settings.showValueLabels === 'Yes';
   } else if (showValueLabelsToggle) {
     showValueLabelsToggle.checked = true; // Default to Yes
   }

   // Update transparent background toggle
   const transparentBackgroundToggle = document.getElementById('transparentBackgroundToggle');
   if (transparentBackgroundToggle) {
     // Handle various formats: true, 'true', 'Yes', 1, '1'
     const isTransparent = settings.transparentBackground === true || 
                          settings.transparentBackground === 'true' || 
                          settings.transparentBackground === 'Yes' || 
                          settings.transparentBackground === 1 || 
                          settings.transparentBackground === '1';
     
     transparentBackgroundToggle.checked = isTransparent;
    //  console.log('Initialized transparent background from Excel:', settings.transparentBackground, '-> checked:', isTransparent);
     
     // Apply the transparent background state to UI
     const backgroundColorInput = document.getElementById('backgroundColor');
     if (backgroundColorInput) {
       backgroundColorInput.disabled = isTransparent;
       backgroundColorInput.style.opacity = isTransparent ? '0.5' : '1';
       backgroundColorInput.style.cursor = isTransparent ? 'not-allowed' : 'pointer';
     }
     
     // Apply the transparent background to the actual SVG
     const svgElement = document.getElementById('energyflows_sankeySVGPARENT');
     if (svgElement) {
       if (isTransparent) {
         svgElement.style.backgroundColor = 'transparent';
        //  console.log('Applied transparent background to SVG');
       } else if (backgroundColorInput && backgroundColorInput.value) {
         svgElement.style.backgroundColor = backgroundColorInput.value;
        //  console.log('Applied background color to SVG:', backgroundColorInput.value);
       }
     }
   }

   // Update unit setting input
   const unitInput = document.getElementById('unitSetting');
   if (unitInput) {
     // Get unit from settings, with empty string as default
     const unitValue = settings.unit !== undefined && settings.unit !== null ? settings.unit : '';
     unitInput.value = unitValue;
     // Update global currentUnit
     window.currentUnit = unitValue;
     if (typeof currentUnit !== 'undefined') {
       currentUnit = unitValue;
     }
     // console.log('Initialized unit setting from Excel:', unitValue);
   }

   // Update global flow opacity input
   const globalFlowOpacityInput = document.getElementById('globalFlowOpacity');
    if (globalFlowOpacityInput) {
      const opacityValue = settings.globalFlowOpacity !== undefined ? 
        settings.globalFlowOpacity : 0.9;
      globalFlowOpacityInput.value = opacityValue;
     // console.log('Updated globalFlowOpacity setting from Excel:', opacityValue);
   }

    // Update decimals round values input
    const decimalsRoundValuesInput = document.getElementById('decimalsRoundValues');
    if (decimalsRoundValuesInput) {
      const decimalsValue = settings.decimalsRoundValues !== undefined && settings.decimalsRoundValues !== null ? 
        settings.decimalsRoundValues : 1;
      decimalsRoundValuesInput.value = decimalsValue;
      // Store globally for use in value formatting
      window.decimalsRoundValues = decimalsValue;
      // console.log('Updated decimalsRoundValues setting from Excel:', decimalsValue);
    }

    // console.log('UI inputs updated successfully');
}

// Function to initialize UI inputs with current settings
function initializeUIInputs() {
  // Try to get current settings from global variables
  let currentSettings = null;

  if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
    currentSettings = window.currentSankeyConfig.settings[0];
  } else if (typeof settings !== 'undefined' && settings[0]) {
    currentSettings = settings[0];
  }

  if (currentSettings) {
    // console.log('Initializing UI inputs with current settings:', currentSettings);

    // Update title input
    const titleInput = document.getElementById('diagramTitle');
    if (titleInput && currentSettings.title) {
      titleInput.value = currentSettings.title;
    }

    // Update scale data value input
    const scaleInput = document.getElementById('scaleDataValue');
    if (scaleInput && currentSettings.scaleDataValue) {
      scaleInput.value = currentSettings.scaleDataValue;
    }

    // Update scale height input
    const scaleHeightInput = document.getElementById('scaleHeight');
    if (scaleHeightInput && currentSettings.scaleHeight) {
      scaleHeightInput.value = currentSettings.scaleHeight;
    }

    // Update scale canvas input
    const scaleCanvasInput = document.getElementById('scaleCanvas');
    if (scaleCanvasInput && currentSettings.scaleCanvas) {
      scaleCanvasInput.value = currentSettings.scaleCanvas;
    }

    // Update scroll extent width input
    const scrollWidthInput = document.getElementById('canvasWidth');
    if (scrollWidthInput) {
      scrollWidthInput.value = currentSettings.canvasWidth || 1600;
    }

    // Update scroll extent height input
    const scrollHeightInput = document.getElementById('canvasHeight');
    if (scrollHeightInput) {
      scrollHeightInput.value = currentSettings.canvasHeight || 1200;
    }

    // Update title font size input
    const titleFontSizeInput = document.getElementById('titleFontSize');
    if (titleFontSizeInput) {
      titleFontSizeInput.value = currentSettings.titleFontSize || 24;
    }

    // Update title position X input
    const titlePositionXInput = document.getElementById('titlePositionX');
    if (titlePositionXInput) {
      titlePositionXInput.value = currentSettings.titlePositionX || 50;
    }

    // Update title position Y input
    const titlePositionYInput = document.getElementById('titlePositionY');
    if (titlePositionYInput) {
      titlePositionYInput.value = currentSettings.titlePositionY || 40;
    }

    // Update title color input
    const titleColorInput = document.getElementById('titleColor');
    if (titleColorInput) {
      titleColorInput.value = currentSettings.titleColor || '#000000';
    }

    // Update background color input
    const backgroundColorInput = document.getElementById('backgroundColor');
    if (backgroundColorInput) {
      backgroundColorInput.value = currentSettings.backgroundColor || '#FFFFFF';
    }

    // Update node color input
    const nodeColorInput = document.getElementById('nodeColor');
    if (nodeColorInput) {
      nodeColorInput.value = currentSettings.nodeColor || '#555555';
    }

    // Update node width input
    const nodeWidthInput = document.getElementById('nodeWidth');
    if (nodeWidthInput) {
      nodeWidthInput.value = currentSettings.nodeWidth || 15;
    }

    // Update label fill color input
    const labelFillColorInput = document.getElementById('labelFillColor');
    if (labelFillColorInput) {
      labelFillColorInput.value = currentSettings.labelFillColor || '#FFFFFF';
    }

     // Update label text color input
     const labelTextColorInput = document.getElementById('labelTextColor');
     if (labelTextColorInput) {
       labelTextColorInput.value = currentSettings.labelTextColor || '#000000';
     }

     // Update show value labels toggle
     const showValueLabelsToggle = document.getElementById('showValueLabelsToggle');
     if (showValueLabelsToggle) {
       showValueLabelsToggle.checked = (currentSettings.showValueLabels || 'Yes') === 'Yes';
     }

     // Update transparent background toggle
     const transparentBackgroundToggle = document.getElementById('transparentBackgroundToggle');
     if (transparentBackgroundToggle) {
       // Handle various formats: true, 'true', 'Yes', 1, '1'
       const isTransparent = currentSettings.transparentBackground === true || 
                            currentSettings.transparentBackground === 'true' || 
                            currentSettings.transparentBackground === 'Yes' || 
                            currentSettings.transparentBackground === 1 || 
                            currentSettings.transparentBackground === '1';
       
       transparentBackgroundToggle.checked = isTransparent;
      //  console.log('Initialized transparent background from current settings:', currentSettings.transparentBackground, '-> checked:', isTransparent);
       
       // Apply the transparent background state to UI
       const backgroundColorInput = document.getElementById('backgroundColor');
       if (backgroundColorInput) {
         backgroundColorInput.disabled = isTransparent;
         backgroundColorInput.style.opacity = isTransparent ? '0.5' : '1';
         backgroundColorInput.style.cursor = isTransparent ? 'not-allowed' : 'pointer';
       }
       
       // Apply the transparent background to the actual SVG
       const svgElement = document.getElementById('energyflows_sankeySVGPARENT');
       if (svgElement) {
         if (isTransparent) {
           svgElement.style.backgroundColor = 'transparent';
          //  console.log('Applied transparent background to SVG from initialization');
         } else if (backgroundColorInput && backgroundColorInput.value) {
           svgElement.style.backgroundColor = backgroundColorInput.value;
          //  console.log('Applied background color to SVG from initialization:', backgroundColorInput.value);
         }
       }
     }

     // Update unit setting input
     const unitInput = document.getElementById('unitSetting');
     if (unitInput) {
       // Get unit from settings, with empty string as default
       const unitValue = currentSettings.unit !== undefined && currentSettings.unit !== null ? currentSettings.unit : '';
       unitInput.value = unitValue;
       // Update global currentUnit
       window.currentUnit = unitValue;
       if (typeof currentUnit !== 'undefined') {
         currentUnit = unitValue;
       }
       // console.log('Initialized unit setting from current settings:', unitValue);
     }

     // Update global flow opacity input
     const globalFlowOpacityInput = document.getElementById('globalFlowOpacity');
     const globalFlowOpacityValue = document.getElementById('globalFlowOpacityValue');
     if (globalFlowOpacityInput && globalFlowOpacityValue) {
       const opacityValue = currentSettings.globalFlowOpacity !== undefined ? 
         currentSettings.globalFlowOpacity : 0.9;
       globalFlowOpacityInput.value = opacityValue;
       globalFlowOpacityValue.textContent = opacityValue;
      //  console.log('Initialized globalFlowOpacity setting:', opacityValue);
       
       // Apply initial opacity to flows if diagram is already loaded
       setTimeout(() => {
         const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
         if (sankeyDiagram) {
           const flows = sankeyDiagram.querySelectorAll('.links .link path');
           flows.forEach(flow => {
             flow.style.opacity = opacityValue;
           });
          //  console.log(`Applied initial opacity ${opacityValue} to ${flows.length} flows`);
         }
       }, 500);
     }

    // console.log('UI inputs initialized successfully');
  } else {
    console.warn('No settings found for UI initialization');
  }
}

// Initialize the title input with the current title when the page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    const titleInput = document.getElementById('diagramTitle');

    // Try to get the current title from various sources
    let currentTitle = '';
    if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
      currentTitle = window.currentSankeyConfig.settings[0].title;
    } else if (typeof settings !== 'undefined' && settings[0] && settings[0].title) {
      currentTitle = settings[0].title;
    }

    if (titleInput && currentTitle) {
      titleInput.value = currentTitle;
    }

    // Initialize the scale input with the current scale value
    const scaleInput = document.getElementById('scaleDataValue');
    let currentScale = '';
    if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
      currentScale = window.currentSankeyConfig.settings[0].scaleDataValue;
    } else if (typeof settings !== 'undefined' && settings[0] && settings[0].scaleDataValue) {
      currentScale = settings[0].scaleDataValue;
    }

    if (scaleInput && currentScale) {
      scaleInput.value = currentScale;
    }

    // Initialize the scale height input with the current scale height value
    const scaleHeightInput = document.getElementById('scaleHeight');
    let currentScaleHeight = '';
    if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
      currentScaleHeight = window.currentSankeyConfig.settings[0].scaleHeight;
    } else if (typeof settings !== 'undefined' && settings[0] && settings[0].scaleHeight) {
      currentScaleHeight = settings[0].scaleHeight;
    }

    if (scaleHeightInput && currentScaleHeight) {
      scaleHeightInput.value = currentScaleHeight;
    }

    // Initialize the canvas scale input with the current canvas scale value
    const scaleCanvasInput = document.getElementById('scaleCanvas');
    let currentScaleCanvas = '';
    if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
      currentScaleCanvas = window.currentSankeyConfig.settings[0].scaleCanvas;
    } else if (typeof settings !== 'undefined' && settings[0] && settings[0].scaleCanvas) {
      currentScaleCanvas = settings[0].scaleCanvas;
    }

    if (scaleCanvasInput && currentScaleCanvas) {
      scaleCanvasInput.value = currentScaleCanvas;
      // Apply the initial canvas scale
      if (window.currentSankeyConfig) {
        applyCanvasScale(currentScaleCanvas, window.currentSankeyConfig);
      }
    } else if (scaleCanvasInput) {
      // Set default value of 1.0 if no canvas scale is specified
      scaleCanvasInput.value = 1.0;
    }

    // Initialize all UI inputs with current settings
    initializeUIInputs();

    // Generate legend color controls
    setTimeout(() => {
      generateLegendColorControls();
    }, 100);

    // Apply initial title styling from settings
    setTimeout(() => {
      const existingTitle = document.querySelector('#energyflows_sankeySVGPARENT text#diagramTitle');
      if (existingTitle && window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
        const settings = window.currentSankeyConfig.settings[0];
        if (settings.titleFontSize) {
          existingTitle.style.fontSize = settings.titleFontSize + 'px';
        }
        if (settings.titlePositionX) {
          existingTitle.setAttribute('x', settings.titlePositionX);
        }
        if (settings.titlePositionY) {
          existingTitle.setAttribute('y', settings.titlePositionY);
        }
        if (settings.titleColor) {
          existingTitle.style.fill = settings.titleColor;
        }
        // console.log('Applied initial title styling:', {
        //   fontSize: settings.titleFontSize,
        //   x: settings.titlePositionX,
        //   y: settings.titlePositionY,
        //   color: settings.titleColor
        // });
      }

      // Apply initial background color from settings
      const existingSVG = document.querySelector('#energyflows_sankeySVGPARENT');
      if (existingSVG && window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
        const settings = window.currentSankeyConfig.settings[0];
        
        // Check if transparent background is enabled first
        const isTransparent = settings.transparentBackground === true || 
                             settings.transparentBackground === 'true' || 
                             settings.transparentBackground === 'Yes' || 
                             settings.transparentBackground === 1 || 
                             settings.transparentBackground === '1';
        
        if (isTransparent) {
          existingSVG.style.backgroundColor = 'transparent';
          // console.log('Applied initial transparent background (overriding color setting)');
        } else if (settings.backgroundColor) {
          existingSVG.style.backgroundColor = settings.backgroundColor;
          // console.log('Applied initial background color:', settings.backgroundColor);
        }
        
        // Apply initial node color from settings
        if (settings.nodeColor) {
          const nodeRects = existingSVG.querySelectorAll('.nodes .node .node-click-target');
          nodeRects.forEach(rect => {
            rect.style.fill = settings.nodeColor;
          });
          // console.log('Applied initial node color:', settings.nodeColor);
        }

        // Apply initial label fill color setting
        if (settings.labelFillColor) {
          const titleBackdrops = existingSVG.querySelectorAll('.nodes .node .node-backdrop-title');
          const valueBackdrops = existingSVG.querySelectorAll('.nodes .node .node-backdrop-value');
          
          titleBackdrops.forEach(backdrop => {
            backdrop.style.fill = settings.labelFillColor;
          });
          valueBackdrops.forEach(backdrop => {
            backdrop.style.fill = settings.labelFillColor;
          });
          // console.log('Applied initial label fill color:', settings.labelFillColor);
        }

        // Apply initial showValueLabels setting
        const showValueLabelsSetting = settings.showValueLabels || 'Yes';
        const valueLabels = existingSVG.querySelectorAll('.nodes .node .node-value');
        const valueLabelsBackdrop = existingSVG.querySelectorAll('.nodes .node .node-backdrop-value');
        let processedCount = 0;
        
        valueLabels.forEach(label => {
          // Find the parent node element to get the node data
          const nodeElement = label.closest('.node');
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || '';
            // Never show labels for nodes starting with '.'
            if (nodeName.startsWith('.')) {
              label.style.display = 'none';
            } else {
              label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
              processedCount++;
            }
          } else {
            // Fallback: if no data available, respect the setting
            label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
            processedCount++;
          }
        });

        // Also hide/show value label backdrops
        valueLabelsBackdrop.forEach(label => {
          const nodeElement = label.closest('.node');
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || '';
            if (nodeName.startsWith('.')) {
              label.style.display = 'none';
            } else {
              label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
            }
          } else {
            label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
          }
        });
        
        // console.log('Applied initial showValueLabels:', showValueLabelsSetting, 'to', processedCount, 'labels (excluded', valueLabels.length - processedCount, 'dot-prefixed nodes)');

        // Apply initial flow opacity setting
        if (settings.globalFlowOpacity !== undefined) {
          const flows = existingSVG.querySelectorAll('.links .link path');
          flows.forEach(flow => {
            flow.style.opacity = settings.globalFlowOpacity;
          });
          // console.log('Applied initial flow opacity:', settings.globalFlowOpacity, 'to', flows.length, 'flows');
        }
      }
    }, 500);

    // Check for offscreen nodes on initialization
    if (window.currentSankeyConfig) {
      // console.log('Running initial offscreen node check...');
      setTimeout(() => {
        checkOffscreenNodes(window.currentSankeyConfig);
      }, 200); // Small additional delay to ensure everything is rendered
    }
  }, 1000); // Wait a seconds for the sankey to load
});





//
//
//        UPDATE SETTING FUNCTIONS
//
//


// Function to update diagram title and reload sankey
let titleUpdateTimeout;
function updateDiagramTitle(newTitle) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(titleUpdateTimeout);

  titleUpdateTimeout = setTimeout(() => {
    // Try to access the config from the global variable set by drawSankey.js
    let config = window.currentSankeyConfig;

    // Fallback: try to access through global variables
    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    // Another fallback: try sankeyConfigs if available
    if (!config && typeof sankeyConfigs !== 'undefined') {
      config = sankeyConfigs.find(c => c.sankeyInstanceID === 'energyflows');
    }

    if (config && config.settings && config.settings[0]) {
      // Update the title in the config
      config.settings[0].title = newTitle || 'Sankey Diagram';

      // console.log('=== TITLE UPDATE DEBUG ===');
      // console.log('New title:', newTitle);
      // console.log('Config:', config);
      // console.log('Window variables available:', {
      //   processData: !!window.processData,
      //   nodesGlobal: !!window.nodesGlobal,
      //   links: !!window.links,
      //   legend: !!window.legend,
      //   settings: !!window.settings,
      //   remarks: !!window.remarks,
      //   sankeyDataObject: !!sankeyDataObject,
      //   drawSankey: !!window.drawSankey,
      //   reSankey: !!window.reSankey,
      //   tick: !!window.tick
      // });

      // Try a simple approach first - just update the existing title text without redrawing
      const existingTitle = document.querySelector('#energyflows_sankeySVGPARENT text');
      if (existingTitle) {
        // console.log('Found existing title element, updating text only');
        existingTitle.textContent = newTitle || 'Sankey Diagram';
        return; // Exit early - don't redraw the whole diagram
      }

      // If no existing title found, try full redraw
      // console.log('No existing title found, attempting full redraw');

      // Try the most complete redraw approach - call processData again
      const carriersData = window.legend || window.carriers;
      if (window.processData && window.nodesGlobal && carriersData && window.settings && window.remarks && window.links) {
        // console.log('Using processData approach');
        try {
          // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
          window.selectionButtonsHaveInitialized = false;
          window.processData(window.links, window.nodesGlobal, carriersData, window.settings, window.remarks, config);
          // console.log('processData completed successfully');
        } catch (error) {
          console.error('Error in processData approach:', error);
        }
      }
      // Fallback: try the drawSankey + reSankey approach
      else if (sankeyDataObject && sankeyDataObject.links && window.drawSankey) {
        // console.log('Using drawSankey + reSankey approach');
        try {
          // Complete redraw sequence that mirrors the initial loading
          window.drawSankey(sankeyDataObject, config);

          // Ensure the scenario is properly set and trigger complete rendering
          if (window.reSankey && globalActiveEnergyflowsFilter !== undefined && activeScenario !== undefined) {
            // console.log('Calling reSankey with filter:', globalActiveEnergyflowsFilter, 'scenario:', activeScenario);
            window.reSankey(globalActiveEnergyflowsFilter, activeScenario, config);
          } else if (window.tick) {
            // console.log('Calling tick directly');
            window.tick(config);
          }
          // console.log('drawSankey approach completed');
        } catch (error) {
          console.error('Error in drawSankey approach:', error);
        }
      } else {
        console.error('No viable redraw approach available');
      }
    } else {
      console.warn('Could not find config or settings to update title', {
        windowCurrentSankeyConfig: window.currentSankeyConfig,
        settings: typeof settings !== 'undefined' ? settings : 'undefined',
        sankeyConfigs: typeof sankeyConfigs !== 'undefined' ? sankeyConfigs : 'undefined'
      });
    }
  }, 300); // Wait 300ms after user stops typing
}

// Function to update scale data value and fully reload sankey
let scaleUpdateTimeout;
function updateScaleDataValue(newScale) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(scaleUpdateTimeout);

  scaleUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newScale) || newScale <= 0) {
      console.warn('Invalid scale value:', newScale, 'Must be a positive number > 0');
      return;
    }

    // console.log('=== SCALE UPDATE DEBUG ===');
    // console.log('New scale value:', newScale);

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the scale value in the config
      config.settings[0].scaleDataValue = newScale;
      // console.log('Updated scaleDataValue to:', newScale);

      // For scale changes, we MUST do a full reload since it affects data processing
      const carriersData = window.legend || window.carriers;
      if (window.processData && window.nodesGlobal && carriersData && window.settings && window.remarks && window.originalLinksData) {
        // console.log('Performing full reload with processData using original data');
        try {
          // Update the global settings
          window.settings[0].scaleDataValue = newScale;

          // Create a fresh copy of the original unscaled links data
          const freshLinksData = JSON.parse(JSON.stringify(window.originalLinksData));

          // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
          window.selectionButtonsHaveInitialized = false;

          // Call processData with the fresh unscaled data and new scale
          window.processData(freshLinksData, window.nodesGlobal, carriersData, window.settings, window.remarks, config);
          // console.log('Full reload completed successfully with scale:', newScale);
        } catch (error) {
          console.error('Error in full reload:', error);
        }
      } else {
        console.error('Cannot perform full reload - missing required data or functions', {
          processData: !!window.processData,
          nodesGlobal: !!window.nodesGlobal,
          legend: !!window.legend,
          carriers: !!window.carriers,
          carriersData: !!(window.legend || window.carriers),
          settings: !!window.settings,
          remarks: !!window.remarks,
          originalLinksData: !!window.originalLinksData
        });
      }
    } else {
      console.warn('Could not find config or settings to update scale value');
    }
  }, 500); // Wait 500ms after user stops typing (longer than title since this is more expensive)
}

// Function to update scale height and fully reload sankey
let scaleHeightUpdateTimeout;
function updateScaleHeight(newScaleHeight) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(scaleHeightUpdateTimeout);

  scaleHeightUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newScaleHeight) || newScaleHeight <= 0) {
      console.warn('Invalid scale height value:', newScaleHeight, 'Must be a positive number > 0');
      return;
    }

    // console.log('=== SCALE HEIGHT UPDATE DEBUG ===');
    // console.log('New scale height value:', newScaleHeight);

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the scale height value in the config
      config.settings[0].scaleHeight = newScaleHeight;
      // console.log('Updated scaleHeight to:', newScaleHeight);

      // For scale height changes, we MUST do a full reload since it affects layout
      const carriersData = window.legend || window.carriers;
      if (window.processData && window.nodesGlobal && carriersData && window.settings && window.remarks && window.originalLinksData) {
        // console.log('Performing full reload with processData using original data');
        try {
          // Update the global settings
          window.settings[0].scaleHeight = newScaleHeight;

          // Create a fresh copy of the original unscaled links data
          const freshLinksData = JSON.parse(JSON.stringify(window.originalLinksData));

          // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
          window.selectionButtonsHaveInitialized = false;

          // Call processData for complete reprocessing with new scale height
          window.processData(freshLinksData, window.nodesGlobal, carriersData, window.settings, window.remarks, config);
          // console.log('Full reload completed successfully with scale height:', newScaleHeight);
        } catch (error) {
          console.error('Error in full reload:', error);
        }
      } else {
        console.error('Cannot perform full reload - missing required data or functions', {
          processData: !!window.processData,
          nodesGlobal: !!window.nodesGlobal,
          legend: !!window.legend,
          carriers: !!window.carriers,
          carriersData: !!(window.legend || window.carriers),
          settings: !!window.settings,
          remarks: !!window.remarks,
          originalLinksData: !!window.originalLinksData
        });
      }
    } else {
      console.warn('Could not find config or settings to update scale height value');
    }
  }, 500); // Wait 500ms after user stops typing
}

// Function to update canvas scale and adjust SVG viewBox
let scaleCanvasUpdateTimeout;
function updateScaleCanvas(newScaleCanvas) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(scaleCanvasUpdateTimeout);

  scaleCanvasUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newScaleCanvas) || newScaleCanvas <= 0) {
      console.warn('Invalid canvas scale value:', newScaleCanvas, 'Must be a positive number > 0');
      return;
    }

    // console.log('=== CANVAS SCALE UPDATE DEBUG ===');
    // console.log('New canvas scale value:', newScaleCanvas);

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the canvas scale value in the config
      config.settings[0].scaleCanvas = newScaleCanvas;
      // console.log('Updated scaleCanvas to:', newScaleCanvas);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].scaleCanvas = newScaleCanvas;
      }

      // Apply the viewBox scaling to the SVG
      applyCanvasScale(newScaleCanvas, config);

      // Check if nodes are now offscreen and show/hide the button accordingly
      // Add a small delay to ensure DOM has updated
      setTimeout(() => {
        checkOffscreenNodes(config);
      }, 100);
    } else {
      console.warn('Could not find config or settings to update canvas scale value');
    }
  }, 300); // Shorter delay for visual scaling
}

// Function to apply canvas scaling by adjusting SVG viewBox
function applyCanvasScale(scaleValue, config) {
  const svgElement = document.getElementById(config.sankeyInstanceID + '_sankeySVGPARENT');
  if (!svgElement) {
    console.warn('SVG element not found for canvas scaling');
    return;
  }

  // Get the current SVG dimensions
  const svgWidth = parseInt(svgElement.getAttribute('width')) || 1600;
  const svgHeight = parseInt(svgElement.getAttribute('height')) || 1200;

  // Calculate new viewBox dimensions (inverse of scale for zoom effect)
  const viewBoxWidth = svgWidth / scaleValue;
  const viewBoxHeight = svgHeight / scaleValue;

  // Set viewBox with origin at top-left (0, 0)
  const newViewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
  svgElement.setAttribute('viewBox', newViewBox);

  // console.log(`Applied canvas scale ${scaleValue}: viewBox="${newViewBox}"`);
}

// Function to update title font size
let titleFontSizeUpdateTimeout;
function updateTitleFontSize(newFontSize) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(titleFontSizeUpdateTimeout);

  titleFontSizeUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newFontSize) || newFontSize < 8) {
      console.warn('Invalid font size value:', newFontSize, 'Must be a number >= 8');
      return;
    }

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the title font size in the config
      config.settings[0].titleFontSize = newFontSize;
      // console.log('Updated titleFontSize to:', newFontSize);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].titleFontSize = newFontSize;
      }

      // Apply the font size to existing title
      const existingTitle = document.querySelector('#energyflows_sankeySVGPARENT text');
      if (existingTitle) {
        existingTitle.style.fontSize = newFontSize + 'px';
      }
    } else {
      console.warn('Could not find config or settings to update title font size');
    }
  }, 300); // 300ms debounce
}

// Function to update title X position
let titlePositionXUpdateTimeout;
function updateTitlePositionX(newPositionX) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(titlePositionXUpdateTimeout);

  titlePositionXUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newPositionX)) {
      console.warn('Invalid X position value:', newPositionX, 'Must be a number');
      return;
    }

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the title X position in the config
      config.settings[0].titlePositionX = newPositionX;
      // console.log('Updated titlePositionX to:', newPositionX);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].titlePositionX = newPositionX;
      }

      // Apply the X position to existing title
      const existingTitle = document.querySelector('#energyflows_sankeySVGPARENT text');
      if (existingTitle) {
        existingTitle.setAttribute('x', newPositionX);
      }
    } else {
      console.warn('Could not find config or settings to update title X position');
    }
  }, 300); // 300ms debounce
}

// Function to update title Y position
let titlePositionYUpdateTimeout;
function updateTitlePositionY(newPositionY) {
  // Clear previous timeout to debounce rapid typing
  clearTimeout(titlePositionYUpdateTimeout);

  titlePositionYUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newPositionY)) {
      console.warn('Invalid Y position value:', newPositionY, 'Must be a number');
      return;
    }

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the title Y position in the config
      config.settings[0].titlePositionY = newPositionY;
      // console.log('Updated titlePositionY to:', newPositionY);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].titlePositionY = newPositionY;
      }

      // Apply the Y position to existing title
      const existingTitle = document.querySelector('#energyflows_sankeySVGPARENT text');
      if (existingTitle) {
        existingTitle.setAttribute('y', newPositionY);
      }
    } else {
      console.warn('Could not find config or settings to update title Y position');
    }
  }, 300); // 300ms debounce
}

// Function to update background color
let backgroundColorUpdateTimeout;
function updateBackgroundColor(newColor) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(backgroundColorUpdateTimeout);

  backgroundColorUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the background color in the config
      config.settings[0].backgroundColor = newColor;
      // console.log('Updated backgroundColor to:', newColor);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].backgroundColor = newColor;
      }

      // Apply the background color to existing SVG (only if transparent background is not enabled)
      const existingSVG = document.querySelector('#energyflows_sankeySVGPARENT');
      if (existingSVG) {
        // Check if transparent background is enabled
        const isTransparent = config.settings[0].transparentBackground === true || 
                             config.settings[0].transparentBackground === 'true' || 
                             config.settings[0].transparentBackground === 'Yes' || 
                             config.settings[0].transparentBackground === 1 || 
                             config.settings[0].transparentBackground === '1';
        
        if (!isTransparent) {
          existingSVG.style.backgroundColor = newColor;
          // console.log('Applied background color to SVG:', newColor);
        } else {
          // console.log('Skipped applying background color because transparent background is enabled');
        }
      }
    } else {
      console.warn('Could not find config or settings to update background color');
    }
  }, 100); // Shorter delay for visual changes
}

// Function to update title color
let titleColorUpdateTimeout;
function updateTitleColor(newColor) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(titleColorUpdateTimeout);

  titleColorUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the title color in the config
      config.settings[0].titleColor = newColor;
      // console.log('Updated titleColor to:', newColor);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].titleColor = newColor;
      }

      // Apply the title color to existing SVG title
      const existingSVG = document.querySelector('#energyflows_sankeySVGPARENT');
      if (existingSVG) {
        const titleElement = existingSVG.querySelector('.diagram-title');
        if (titleElement) {
          titleElement.style.fill = newColor;
          // console.log('Applied title color to SVG:', newColor);
        } else {
          // console.log('Title element not found in SVG');
        }
      }
    } else {
      console.warn('Could not find config or settings to update title color');
    }
  }, 100); // Shorter delay for visual changes
}

// Function to update node color
let nodeColorUpdateTimeout;
function updateNodeColor(newColor) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(nodeColorUpdateTimeout);

  nodeColorUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the node color in the config
      config.settings[0].nodeColor = newColor;
      // console.log('Updated nodeColor to:', newColor);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].nodeColor = newColor;
      }

      // Apply the node color to existing diagram elements
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        // Update all node rectangles
        const nodeRects = sankeyDiagram.querySelectorAll('.nodes .node .node-click-target');
        nodeRects.forEach(rect => {
          rect.style.fill = newColor;
        });
      }
    } else {
      console.warn('Could not find config or settings to update node color');
    }
  }, 100); // Shorter delay for visual changes
}

// Function to update node width
let nodeWidthUpdateTimeout;
function updateNodeWidth(newWidth) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(nodeWidthUpdateTimeout);

  nodeWidthUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the node width in the config
      config.settings[0].nodeWidth = newWidth;
      // console.log('Updated nodeWidth to:', newWidth);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].nodeWidth = newWidth;
      }

      // Apply the node width to existing diagram elements
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        // Update all node rectangles
        const nodeRects = sankeyDiagram.querySelectorAll('.nodes .node .node-click-target');
        nodeRects.forEach(rect => {
          rect.setAttribute('width', newWidth);
        });
      }
    } else {
      console.warn('Could not find config or settings to update node width');
    }
  }, 100); // Shorter delay for visual changes
}

// Function to update label text color
let labelTextColorUpdateTimeout;
function updateLabelTextColor(newColor) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(labelTextColorUpdateTimeout);

  labelTextColorUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the node color in the config
      config.settings[0].labelTextColor = newColor;
      // console.log('Updated labelTextColor to:', newColor);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].labelTextColor = newColor;
      }

      // Apply the node color to existing diagram elements
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        // Update all node rectangles
        var textElements = sankeyDiagram.querySelectorAll('.nodes .node .node-title');
        textElements.forEach(text => {
          text.style.fill = newColor;
          // value.style.fill = newColor;
        });
        textElements = sankeyDiagram.querySelectorAll('.nodes .node .node-value');
        textElements.forEach(text => {
          text.style.fill = newColor;
          // value.style.fill = newColor;
        });
      }
    } else {
      console.warn('Could not find config or settings to update node color');
    }
  }, 100); // Shorter delay for visual changes
}

// Function to update show value labels setting
function updateShowValueLabels() {
  const toggle = document.getElementById('showValueLabelsToggle');
  if (!toggle) return;

  const newValue = toggle.checked ? 'Yes' : 'No';
  
  // Try to access the config
  let config = window.currentSankeyConfig;

  if (!config && typeof settings !== 'undefined' && settings[0]) {
    config = {
      sankeyInstanceID: 'energyflows',
      targetDIV: 'SVGContainer_energyflows',
      settings: settings,
      legend: typeof legend !== 'undefined' ? legend : null,
      scenarios: typeof scenarios !== 'undefined' ? scenarios : null
    };
  }

  if (config && config.settings && config.settings[0]) {
    // Update the setting in the config
    config.settings[0].showValueLabels = newValue;
    // console.log('Updated showValueLabels to:', newValue);

    // Update the global settings
    if (window.settings && window.settings[0]) {
      window.settings[0].showValueLabels = newValue;
    }

    // Apply the setting to existing diagram elements
    const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
    if (sankeyDiagram) {
      // Show or hide value labels based on the setting, but never show for nodes starting with '.'
      const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-value');
      const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
      let processedCount = 0;
      
      valueLabels.forEach(label => {
        // Find the parent node element to get the node data
        const nodeElement = label.closest('.node');
        if (nodeElement && nodeElement.__data__) {
          const nodeName = nodeElement.__data__.title || '';
          // Never show labels for nodes starting with '.'
          if (nodeName.startsWith('.')) {
            label.style.display = 'none';
          } else {
            label.style.display = newValue === 'Yes' ? 'block' : 'none';
            processedCount++;
          }
        } else {
          // Fallback: if no data available, respect the setting
          label.style.display = newValue === 'Yes' ? 'block' : 'none';
          processedCount++;
        }
      });

      valueLabelsBackdrop.forEach(label => {
        const nodeElement = label.closest('.node');
        if (nodeElement && nodeElement.__data__) {
          const nodeName = nodeElement.__data__.title || '';
          if (nodeName.startsWith('.')) {
            label.style.display = 'none';
          } else {
            label.style.display = newValue === 'Yes' ? 'block' : 'none';
            processedCount++;
          }
        }
      });
      
      // console.log(`${newValue === 'Yes' ? 'Showed' : 'Hidden'} ${processedCount} value labels (excluded ${valueLabels.length - processedCount} dot-prefixed nodes)`);
    }
  } else {
    console.warn('Could not find config or settings to update showValueLabels');
  }
}


// Function to update node color
let labelFillColorUpdateTimeout;
function updateLabelFillColor(newColor) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(labelFillColorUpdateTimeout);

  labelFillColorUpdateTimeout = setTimeout(() => {
    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the node color in the config
      config.settings[0].labelFillColor = newColor;
      // console.log('Updated labelFillColor to:', newColor);

      // Update the global settings
      if (window.settings && window.settings[0]) {
        window.settings[0].labelFillColor = newColor;
      }

      // Apply the node color to existing diagram elements
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        // Update all node rectangles
        var textElements = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-title');
        textElements.forEach(rect => {
          rect.style.fill = newColor;
          // value.style.fill = newColor;
        });
        textElements = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
        textElements.forEach(rect => {
          rect.style.fill = newColor;
          // value.style.fill = newColor;
        });
      }
    } else {
      console.warn('Could not find config or settings to update node color');
    }
  }, 100); // Shorter delay for visual changes
}








// Function to generate legend color controls
function generateLegendColorControls() {
  const legendColorContainer = document.getElementById('carrierColorControls');
  if (!legendColorContainer) {
    console.warn('Legend color controls container not found');
    return;
  }

  // Clear existing controls
  legendColorContainer.innerHTML = '';

  // Get current legend data
  const currentLegend = window.carriers || window.currentSankeyConfig?.carriers;
  
  // console.log('=== LEGEND DEBUG ===');
  // console.log('window.carriers:', window.carriers);
  // console.log('window.currentSankeyConfig?.carriers:', window.currentSankeyConfig?.carriers);
  // console.log('currentLegend:', currentLegend);
  
  // Check for duplicates in the legend data
  if (currentLegend && Array.isArray(currentLegend)) {
    const ids = currentLegend.map(item => item.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn('Duplicate carrier IDs found:', duplicateIds);
      console.warn('Full carrier data with duplicates:', currentLegend);
    } else {
      // console.log('No duplicate carrier IDs found');
    }
  }
  
  if (!currentLegend || !Array.isArray(currentLegend) || currentLegend.length === 0) {
    legendColorContainer.innerHTML = '<div class="no-legend-message">No carrier items found. Check console for debug info.</div>';
    return;
  }

  // console.log('Generating carrier color controls for', currentLegend.length, 'items');
  // console.log('Carrier items:', currentLegend);

  // Generate a control row for each legend item
  currentLegend.forEach((legendItem, index) => {
    // console.log(`Processing legend item ${index}:`, legendItem);
    
    if (!legendItem.id) {
      console.warn(`Skipping carrier item ${index} - no id:`, legendItem);
      return; // Skip items without id
    }

    const controlRow = document.createElement('div');
    controlRow.className = 'control-row carrier-item';
    controlRow.innerHTML = `
      <input type="color" 
             id="carrierColor_${legendItem.id}" 
             class="control-input color-input"
             value="${legendItem.color || '#000000'}"
             data-carrier-id="${legendItem.id}"
             oninput="updateCarrierColor('${legendItem.id}', this.value)">
      <span class="control-label carrier-editable" 
            data-carrier-id="${legendItem.id}"
            onclick="handleCarrierLabelClick(event, '${legendItem.id}')"
            title="Shift+click to edit carrier name">${legendItem.id}</span>
    `;
    legendColorContainer.appendChild(controlRow);
  });
  
  // console.log('Legend color controls generated. Container children:', legendColorContainer.children.length);
}

// Function to handle legend label clicks for editing
function handleCarrierLabelClick(event, carrierId) {
  // Only proceed if Shift key is held
  if (!event.shiftKey) {
    return;
  }
  
  // Prevent default behavior and stop propagation
  event.preventDefault();
  event.stopPropagation();
  
  // console.log('=== EDITING LEGEND LABEL ===');
  // console.log('Legend ID:', legendId);
  
  const labelElement = event.target;
  const currentText = labelElement.textContent;
  
  // Create input element for editing
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'legend-edit-input';
  input.style.cssText = `
    width: 100%;
    padding: 2px 4px;
    border: 1px solid #007bff;
    border-radius: 3px;
    font-size: inherit;
    font-family: inherit;
    background: white;
  `;
  
  // Replace label with input
  labelElement.style.display = 'none';
  labelElement.parentNode.insertBefore(input, labelElement.nextSibling);
  input.focus();
  input.select();
  
  // Handle input completion
  let isFinishing = false; // Prevent multiple calls
  function finishEditing(save = true) {
    if (isFinishing) {
      // console.log('finishEditing already in progress, ignoring duplicate call');
      return;
    }
    isFinishing = true;
    
    const newValue = input.value.trim();
    
    if (save && newValue && newValue !== currentText) {
      // Check if new ID already exists (excluding the current item being edited)
      // console.log('Validating new ID:', newValue, 'Current ID being edited:', legendId);
      
      const duplicateItem = window.legend && window.legend.find(item => {
        const isDuplicate = item.id === newValue && item.id !== legendId;
        // console.log(`Checking item: ${item.id}, matches new value: ${item.id === newValue}, is different from current: ${item.id !== legendId}, is duplicate: ${isDuplicate}`);
        return isDuplicate;
      });
      
      if (duplicateItem) {
        // console.log('Found duplicate item:', duplicateItem);
        alert('A carrier with this ID already exists');
        input.focus();
        return;
      }
      
      // console.log('No duplicate found, proceeding with update');
      
      // console.log('Updating legend ID from', legendId, 'to', newValue);
      
      // Update legend data (check both window.legend and window.carriers)
      const legendData = window.legend || window.carriers;
      if (legendData) {
        const legendItem = legendData.find(item => item.id === legendId);
        if (legendItem) {
          legendItem.id = newValue;
        }
      }
      
      // Update config legend if it exists
      if (window.currentSankeyConfig && window.currentSankeyConfig.legend) {
        const configLegendItem = window.currentSankeyConfig.legend.find(item => item.id === legendId);
        if (configLegendItem) {
          configLegendItem.id = newValue;
        }
      }
      
      // Update all links that use this legend type
      if (window.links) {
        window.links.forEach(link => {
          if (link.legend === legendId) {
            link.legend = newValue;
          }
        });
      }
      
      // Update sankeyDataObject links
      if (window.sankeyDataObject && window.sankeyDataObject.links) {
        window.sankeyDataObject.links.forEach(link => {
          if (link.legend === legendId) {
            link.legend = newValue;
          }
        });
      }
      
      // Update D3-bound data on link elements (this is what gets passed to editLink)
      const linkElements = document.querySelectorAll('.link');
      linkElements.forEach(linkElement => {
        // Check the link group itself
        if (linkElement.__data__ && linkElement.__data__.legend === legendId) {
          linkElement.__data__.legend = newValue;
          // console.log('Updated D3 data for link group:', linkElement.__data__);
        }
        
        // Also check child path elements (sometimes D3 binds data to paths)
        const pathElement = linkElement.querySelector('path');
        if (pathElement && pathElement.__data__ && pathElement.__data__.legend === legendId) {
          pathElement.__data__.legend = newValue;
          // console.log('Updated D3 data for link path:', pathElement.__data__);
        }
      });
      
      // Update the label text
      labelElement.textContent = newValue;
      labelElement.setAttribute('data-carrier-id', newValue);
      
      // Update color input data attribute and ID
      const colorInput = labelElement.parentNode.querySelector('input[type="color"]');
      if (colorInput) {
        colorInput.setAttribute('data-carrier-id', newValue);
        colorInput.id = `carrierColor_${newValue}`;
        colorInput.setAttribute('oninput', `updateCarrierColor('${newValue}', this.value)`);
      }
      
      // Update the onclick handler
      labelElement.setAttribute('onclick', `handleCarrierLabelClick(event, '${newValue}')`);
    }
    
    // Restore label and remove input
    if (input.parentNode) {
      input.remove();
    }
    labelElement.style.display = '';
    isFinishing = false; // Reset flag for next edit
  }
  
  // Event listeners for input
  input.addEventListener('blur', () => {
    // console.log('Input blur event triggered');
    finishEditing(true);
  });
  
  input.addEventListener('keydown', (e) => {
    // console.log('Input keydown event triggered:', e.key);
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or other default behavior
      finishEditing(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishEditing(false);
    }
  });
}

// Function to update legend color
function updateCarrierColor(carrierId, newColor) {
  // console.log('Updating carrier color for', carrierId, 'to', newColor);

  // Update the carriers data
  if (window.carriers) {
    const carrierItem = window.carriers.find(item => item.id === carrierId);
    if (carrierItem) {
      carrierItem.color = newColor;
      
      // Update the diagram
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        const flows = sankeyDiagram.querySelectorAll('.links .link path');
        flows.forEach(flow => {
          const flowData = flow.__data__;
          if (flowData && flowData.carrier === carrierId) {
            flow.style.fill = newColor;
          }
        });
      }
    }
  }

  // Update the config legend if it exists
  if (window.currentSankeyConfig && window.currentSankeyConfig.legend) {
    const configLegendItem = window.currentSankeyConfig.legend.find(item => item.id === legendId);
    if (configLegendItem) {
      configLegendItem.color = newColor;
    }
  }

  // Update the sankeyDataObject links that use this legend
  if (window.sankeyDataObject && window.sankeyDataObject.links) {
    window.sankeyDataObject.links.forEach(link => {
      if (link.legend === legendId) {
        link.color = newColor;
      }
    });
  }

  // Also update any global sankeyData if it exists (used by some functions)
  if (window.sankeyData && window.sankeyData.links) {
    window.sankeyData.links.forEach(link => {
      if (link.legend === legendId) {
        link.color = newColor;
      }
    });
  }

  // Update any existing data bound to DOM elements
  const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
  if (sankeyDiagram) {
    // Update all link paths that use this legend
    const linkGroups = sankeyDiagram.querySelectorAll('.links .link');
    linkGroups.forEach(linkGroup => {
      const pathElement = linkGroup.querySelector('path');
      if (pathElement && pathElement.__data__ && pathElement.__data__.legend === legendId) {
        // Update the data bound to the element
        pathElement.__data__.color = newColor;
        // Update the visual styling
        pathElement.style.fill = newColor;
        pathElement.style.stroke = newColor;
      }
    });

    // Also update the parent group's data if it exists
    const linkGroups2 = sankeyDiagram.querySelectorAll('.links .link');
    linkGroups2.forEach(linkGroup => {
      if (linkGroup.__data__ && linkGroup.__data__.legend === legendId) {
        linkGroup.__data__.color = newColor;
      }
    });
  }

  // console.log('Legend color updated successfully');
}

// Function to update scroll extent width
function updatecanvasWidth(newCanvasWidth) {
  // Clear previous timeout to debounce rapid typing
  if (typeof scrollWidthUpdateTimeout !== 'undefined') {
    clearTimeout(scrollWidthUpdateTimeout);
  }

  scrollWidthUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newCanvasWidth) || newCanvasWidth < 100) {
      console.warn('Invalid scroll width value:', newCanvasWidth, 'Must be >= 100');
      return;
    }

    // console.log('Updating scroll extent width to:', newCanvasWidth);

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the scroll extent width in the config
      config.settings[0].canvasWidth = newCanvasWidth;

      // Store globally for reference
      window.currentSankeyConfig = config;

      // For scroll extent changes, we need to do a full reload since it affects SVG dimensions
      // But we should preserve the current diagram state by using the current processed data
      const carriersData = window.legend || window.carriers;
      if (window.processData && window.nodesGlobal && carriersData && window.settings && window.remarks) {
        // console.log('Performing full reload with processData for scroll extent width');
        try {
          // Update the global settings
          window.settings[0].canvasWidth = newCanvasWidth;

          // Use current processed links data instead of original to preserve edits
          let linksDataToUse;
          if (window.currentProcessedLinksData) {
            // Use the current processed data to preserve any edits
            linksDataToUse = JSON.parse(JSON.stringify(window.currentProcessedLinksData));
            // console.log('Using current processed links data to preserve edits');
          } else if (window.originalLinksData) {
            // Fallback to original data if no processed data available
            linksDataToUse = JSON.parse(JSON.stringify(window.originalLinksData));
            // console.log('Using original links data as fallback');
          } else {
            console.error('No links data available for canvas width update');
            return;
          }

          // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
          window.selectionButtonsHaveInitialized = false;

          // Call processData with the preserved data and new setting
          window.processData(linksDataToUse, window.nodesGlobal, carriersData, window.settings, window.remarks, config);
          // console.log('Full reload completed successfully with scroll width:', newCanvasWidth);

          // Apply showValueLabels setting after canvas width change (multiple passes to ensure it takes effect)
          setTimeout(() => {
            if (window.settings && window.settings[0]) {
              const showValueLabelsSetting = window.settings[0].showValueLabels || 'Yes';
              const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
              if (sankeyDiagram) {
                const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-value');
                const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
                
                valueLabels.forEach(label => {
                  const nodeElement = label.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (nodeName.startsWith('.')) {
                      label.style.display = 'none';
                    } else {
                      label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });

                valueLabelsBackdrop.forEach(backdrop => {
                  const nodeElement = backdrop.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (nodeName.startsWith('.')) {
                      backdrop.style.display = 'none';
                    } else {
                      backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });
                // console.log(`Applied showValueLabels ${showValueLabelsSetting} after canvas width change (first pass)`);
              }
            }
          }, 900);

          // Second pass to ensure backdrops stay hidden
          setTimeout(() => {
            if (window.settings && window.settings[0]) {
              const showValueLabelsSetting = window.settings[0].showValueLabels || 'Yes';
              const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
              if (sankeyDiagram) {
                const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
                
                valueLabelsBackdrop.forEach(backdrop => {
                  const nodeElement = backdrop.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (!nodeName.startsWith('.')) {
                      backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });
                // console.log(`Applied showValueLabels ${showValueLabelsSetting} after canvas width change (second pass)`);
              }
            }
          }, 1200);

          // Reattach event listeners after canvas width change
          setTimeout(() => {
            if (typeof window.debugAttachEventListeners === 'function') {
              window.debugAttachEventListeners();
            }
          }, 800);

          // Check node balance after canvas width change
          setTimeout(() => {
            if (typeof window.checkNodeBalance === 'function') {
              window.checkNodeBalance();
            }
          }, 1000);
        } catch (error) {
          console.error('Error in full reload for scroll width:', error);
        }
      } else {
        console.error('Cannot perform full reload - missing required data or functions', {
          processData: !!window.processData,
          nodesGlobal: !!window.nodesGlobal,
          legend: !!window.legend,
          carriers: !!window.carriers,
          carriersData: !!(window.legend || window.carriers),
          settings: !!window.settings,
          remarks: !!window.remarks,
          originalLinksData: !!window.originalLinksData
        });
      }
    } else {
      console.warn('Could not find config or settings to update scroll extent width');
    }
  }, 500); // Debounce for 500ms
}

// Function to update scroll extent height
function updatecanvasHeight(newCanvasHeight) {
  // Clear previous timeout to debounce rapid typing
  if (typeof scrollHeightUpdateTimeout !== 'undefined') {
    clearTimeout(scrollHeightUpdateTimeout);
  }

  scrollHeightUpdateTimeout = setTimeout(() => {
    // Validate input
    if (isNaN(newCanvasHeight) || newCanvasHeight < 100) {
      console.warn('Invalid scroll height value:', newCanvasHeight, 'Must be >= 100');
      return;
    }

    // console.log('Updating scroll extent height to:', newCanvasHeight);

    // Try to access the config
    let config = window.currentSankeyConfig;

    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        targetDIV: 'SVGContainer_energyflows',
        settings: settings,
        legend: typeof legend !== 'undefined' ? legend : null,
        scenarios: typeof scenarios !== 'undefined' ? scenarios : null
      };
    }

    if (config && config.settings && config.settings[0]) {
      // Update the scroll extent height in the config
      config.settings[0].canvasHeight = newCanvasHeight;

      // Store globally for reference
      window.currentSankeyConfig = config;

      // For scroll extent changes, we need to do a full reload since it affects SVG dimensions
      // But we should preserve the current diagram state by using the current processed data
      const carriersData = window.legend || window.carriers;
      if (window.processData && window.nodesGlobal && carriersData && window.settings && window.remarks) {
        // console.log('Performing full reload with processData for scroll extent height');
        try {
          // Update the global settings
          window.settings[0].canvasHeight = newCanvasHeight;

          // Use current processed links data instead of original to preserve edits
          let linksDataToUse;
          if (window.currentProcessedLinksData) {
            // Use the current processed data to preserve any edits
            linksDataToUse = JSON.parse(JSON.stringify(window.currentProcessedLinksData));
            // console.log('Using current processed links data to preserve edits');
          } else if (window.originalLinksData) {
            // Fallback to original data if no processed data available
            linksDataToUse = JSON.parse(JSON.stringify(window.originalLinksData));
            // console.log('Using original links data as fallback');
          } else {
            console.error('No links data available for canvas height update');
            return;
          }

          // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
          window.selectionButtonsHaveInitialized = false;

          // Call processData with the preserved data and new setting
          window.processData(linksDataToUse, window.nodesGlobal, carriersData, window.settings, window.remarks, config);
          // console.log('Full reload completed successfully with scroll height:', newCanvasHeight);

          // Apply showValueLabels setting after canvas height change (multiple passes to ensure it takes effect)
          setTimeout(() => {
            if (window.settings && window.settings[0]) {
              const showValueLabelsSetting = window.settings[0].showValueLabels || 'Yes';
              const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
              if (sankeyDiagram) {
                const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-value');
                const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
                
                valueLabels.forEach(label => {
                  const nodeElement = label.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (nodeName.startsWith('.')) {
                      label.style.display = 'none';
                    } else {
                      label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });

                valueLabelsBackdrop.forEach(backdrop => {
                  const nodeElement = backdrop.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (nodeName.startsWith('.')) {
                      backdrop.style.display = 'none';
                    } else {
                      backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });
                // console.log(`Applied showValueLabels ${showValueLabelsSetting} after canvas height change (first pass)`);
              }
            }
          }, 900);

          // Second pass to ensure backdrops stay hidden
          setTimeout(() => {
            if (window.settings && window.settings[0]) {
              const showValueLabelsSetting = window.settings[0].showValueLabels || 'Yes';
              const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
              if (sankeyDiagram) {
                const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value');
                
                valueLabelsBackdrop.forEach(backdrop => {
                  const nodeElement = backdrop.closest('.node');
                  if (nodeElement && nodeElement.__data__) {
                    const nodeName = nodeElement.__data__.title || '';
                    if (!nodeName.startsWith('.')) {
                      backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                    }
                  } else {
                    backdrop.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none';
                  }
                });
                // console.log(`Applied showValueLabels ${showValueLabelsSetting} after canvas height change (second pass)`);
              }
            }
          }, 1200);

          // Reattach event listeners after canvas height change
          setTimeout(() => {
            if (typeof window.debugAttachEventListeners === 'function') {
              window.debugAttachEventListeners();
            }
          }, 800);

          // Check node balance after canvas height change
          setTimeout(() => {
            if (typeof window.checkNodeBalance === 'function') {
              window.checkNodeBalance();
            }
          }, 1000);
        } catch (error) {
          console.error('Error in full reload for scroll height:', error);
        }
      } else {
        console.error('Cannot perform full reload - missing required data or functions', {
          processData: !!window.processData,
          nodesGlobal: !!window.nodesGlobal,
          legend: !!window.legend,
          carriers: !!window.carriers,
          carriersData: !!(window.legend || window.carriers),
          settings: !!window.settings,
          remarks: !!window.remarks,
          originalLinksData: !!window.originalLinksData
        });
      }
    } else {
      console.warn('Could not find config or settings to update scroll extent height');
    }
  }, 500); // Debounce for 500ms
}

//
//
//        FUNCTIONS FOR HANDLING OFFSCREEN NODES
//
//

// Function to check if any nodes are outside the current viewBox
function checkOffscreenNodes(config) {
  const svgElement = document.getElementById(config.sankeyInstanceID + '_sankeySVGPARENT');
  const bringNodesButton = document.getElementById('bringNodesButton');

  // console.log('=== CHECKING OFFSCREEN NODES ===');
  // console.log('SVG element found:', !!svgElement);
  // console.log('Button element found:', !!bringNodesButton);

  if (!svgElement || !bringNodesButton) {
    console.warn('Missing SVG or button element for offscreen detection');
    return;
  }

  // Get current viewBox
  const viewBoxAttr = svgElement.getAttribute('viewBox');
  // console.log('ViewBox attribute:', viewBoxAttr);

  if (!viewBoxAttr) {
    console.warn('No viewBox attribute found on SVG');
    return;
  }

  const [x, y, width, height] = viewBoxAttr.split(' ').map(parseFloat);
  // console.log('ViewBox bounds:', { x, y, width, height });

  // Try multiple methods to get node data
  let nodes = [];

  // Method 1: D3 selection data
  const d3Nodes = d3.selectAll(`#${config.sankeyInstanceID} .node`);
  // console.log('D3 nodes found:', d3Nodes.size());
  if (d3Nodes.size() > 0) {
    nodes = d3Nodes.data();
    // console.log('Using D3 node data, count:', nodes.length);
  }

  // Method 2: sankeyDataObject fallback
  if (nodes.length === 0 && sankeyDataObject && sankeyDataObject.nodes) {
    nodes = sankeyDataObject.nodes;
    // console.log('Using sankeyDataObject nodes, count:', nodes.length);
  }

  // Method 3: global nodes fallback
  if (nodes.length === 0 && window.nodesGlobal) {
    nodes = window.nodesGlobal;
    // console.log('Using window.nodesGlobal, count:', nodes.length);
  }

  if (nodes.length === 0) {
    console.warn('No node data found for offscreen detection');
    return;
  }

  let hasOffscreenNodes = false;
  let offscreenCount = 0;

  nodes.forEach((node, index) => {
    const nodeX = node.x0 || node.x || 0;
    const nodeY = node.y0 || node.y || 0;
    const nodeWidth = (node.x1 - node.x0) || 20;
    const nodeHeight = (node.y1 - node.y0) || 20;

    // Check if node is outside viewBox bounds
    const isOffscreen = nodeX < x || nodeY < y ||
      nodeX + nodeWidth > x + width ||
      nodeY + nodeHeight > y + height;

    if (isOffscreen) {
      hasOffscreenNodes = true;
      offscreenCount++;
      // if (index < 5) { // Log first 5 offscreen nodes for debugging
      //   console.log(`Node ${node.id || index} is offscreen:`, {
      //     nodePos: { x: nodeX, y: nodeY, w: nodeWidth, h: nodeHeight },
      //     viewBox: { x, y, width, height }
      //   });
      // }
    }
  });

  // console.log(`Found ${offscreenCount} offscreen nodes out of ${nodes.length} total`);

  // Show or hide the button based on whether there are offscreen nodes
  if (hasOffscreenNodes) {
    bringNodesButton.style.display = 'inline-flex';
    // console.log('✓ Offscreen nodes detected - showing bring nodes button');
  } else {
    bringNodesButton.style.display = 'none';
    // console.log('✓ All nodes within viewBox - hiding bring nodes button');
  }
}

// Function to bring all offscreen nodes back into the viewBox
function bringNodesIntoView() {
  const config = window.currentSankeyConfig;
  if (!config) {
    console.warn('No sankey config available');
    return;
  }

  const svgElement = document.getElementById(config.sankeyInstanceID + '_sankeySVGPARENT');
  if (!svgElement) {
    console.warn('SVG element not found');
    return;
  }

  // Get current viewBox
  let viewBoxAttr = svgElement.getAttribute('viewBox');
  if (!viewBoxAttr) {
    console.warn('No viewBox found on SVG, creating one from width/height with scale');
    
    // Try to get dimensions from width/height attributes
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    
    if (width && height) {
      // Remove 'px' suffix if present
      const cleanWidth = parseFloat(width.replace('px', ''));
      const cleanHeight = parseFloat(height.replace('px', ''));
      
      // Get scale canvas setting
      let scaleCanvas = 1.0;
      if (config && config.settings && config.settings[0] && config.settings[0].scaleCanvas) {
        scaleCanvas = config.settings[0].scaleCanvas;
      }
      
      // Calculate viewBox dimensions based on scale (inverse of scale for zoom effect)
      const viewBoxWidth = cleanWidth / scaleCanvas;
      const viewBoxHeight = cleanHeight / scaleCanvas;
      
      // Create viewBox and set it
      viewBoxAttr = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
      svgElement.setAttribute('viewBox', viewBoxAttr);
      // console.log('Created viewBox with scale', scaleCanvas + ':', viewBoxAttr);
    } else {
      console.error('Cannot create viewBox - no width/height attributes found');
      return;
    }
  }

  const [viewX, viewY, viewWidth, viewHeight] = viewBoxAttr.split(' ').map(parseFloat);

  // Get all nodes and find offscreen ones
  let nodes = [];
  const d3Nodes = d3.selectAll(`#${config.sankeyInstanceID} .node`);
  if (d3Nodes.size() > 0) {
    nodes = d3Nodes.data();
  } else if (sankeyDataObject && sankeyDataObject.nodes) {
    nodes = sankeyDataObject.nodes;
  } else if (window.nodesGlobal) {
    nodes = window.nodesGlobal;
  }

  // Find all offscreen nodes
  const offscreenNodes = [];
  nodes.forEach(node => {
    const nodeX = node.x0 || node.x || 0;
    const nodeY = node.y0 || node.y || 0;
    const nodeWidth = (node.x1 - node.x0) || 20;
    const nodeHeight = (node.y1 - node.y0) || 20;

    // Check if node is outside viewBox bounds
    const isOffscreen = nodeX < viewX || nodeY < viewY ||
      nodeX + nodeWidth > viewX + viewWidth ||
      nodeY + nodeHeight > viewY + viewHeight;

    if (isOffscreen) {
      offscreenNodes.push({
        node: node,
        originalX: nodeX,
        originalY: nodeY,
        width: nodeWidth,
        height: nodeHeight
      });
    }
  });

  if (offscreenNodes.length === 0) {
    // console.log('No offscreen nodes found');
    document.getElementById('bringNodesButton').style.display = 'none';
    return;
  }

  // console.log(`Found ${offscreenNodes.length} offscreen nodes to reposition`);

  // Calculate positioning parameters for bottom-right area
  const margin = 20; // Margin from edges
  const nodeSpacing = 5; // Spacing between nodes
  const maxNodeWidth = Math.max(...offscreenNodes.map(n => n.width));
  const maxNodeHeight = Math.max(...offscreenNodes.map(n => n.height));

  // Calculate how many nodes can fit in a row
  const availableWidth = viewWidth - (2 * margin);
  const nodesPerRow = Math.floor(availableWidth / (maxNodeWidth + nodeSpacing));
  const actualNodesPerRow = Math.max(1, nodesPerRow); // At least 1 node per row

  // Calculate starting position in bottom-right area
  const totalRows = Math.ceil(offscreenNodes.length / actualNodesPerRow);
  const totalHeight = totalRows * (maxNodeHeight + nodeSpacing) - nodeSpacing;

  // Start from bottom-right, working upwards
  const startX = viewX + viewWidth - margin;
  const startY = viewY + viewHeight - margin - totalHeight;

  // console.log('Repositioning parameters:', {
  //   viewBox: { x: viewX, y: viewY, width: viewWidth, height: viewHeight },
  //   margin,
  //   nodesPerRow: actualNodesPerRow,
  //   totalRows,
  //   startPos: { x: startX, y: startY }
  // });

  // Position each offscreen node
  offscreenNodes.forEach((nodeData, index) => {
    const row = Math.floor(index / actualNodesPerRow);
    const col = index % actualNodesPerRow;

    // Calculate position (right-aligned in each row)
    const newX = startX - (col + 1) * (maxNodeWidth + nodeSpacing) + nodeSpacing;
    const newY = startY + row * (maxNodeHeight + nodeSpacing);

    // Update node position data
    const node = nodeData.node;
    node.x0 = newX;
    node.y0 = newY;
    node.x1 = newX + nodeData.width;
    node.y1 = newY + nodeData.height;

    // Update the underlying data in sankeyDataObject
    const nodeIndex = sankeyDataObject.nodes.findIndex(n => n.id === node.id);
    if (nodeIndex !== -1) {
      sankeyDataObject.nodes[nodeIndex].x = newX;
      sankeyDataObject.nodes[nodeIndex].y = newY;
    }

    // console.log(`Moved node ${node.id || index} from (${nodeData.originalX}, ${nodeData.originalY}) to (${newX}, ${newY})`);
  });

  // console.log(`Successfully repositioned ${offscreenNodes.length} nodes to bottom-right area`);

  // Redraw the sankey diagram with updated positions
  try {
    const updatedJson = JSON.stringify(sankeyDataObject);
    d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
      .datum(sankeyInstances[config.sankeyInstanceID].sankeyLayout.scale(scaleHeight)(JSON.parse(updatedJson)))
      .call(sankeyInstances[config.sankeyInstanceID].sankeyDiagram);

    // Reapply drag behavior after redraw
    setTimeout(() => {
      if (typeof applyDragBehavior === 'function') {
        applyDragBehavior(config);
      }
      // Check again if there are still offscreen nodes
      checkOffscreenNodes(config);
    }, 100);

  } catch (error) {
    console.error('Error redrawing sankey after bringing nodes into view:', error);
  }
}

// Debug function to manually test offscreen detection (can be called from console)
window.testOffscreenDetection = function () {
  // console.log('=== MANUAL OFFSCREEN TEST ===');
  if (window.currentSankeyConfig) {
    checkOffscreenNodes(window.currentSankeyConfig);
  } else {
    console.error('No sankey config available');
  }
};

// Debug function to force show the button for testing
window.forceShowButton = function () {
  const button = document.getElementById('bringNodesButton');
  if (button) {
    button.style.display = 'inline-flex';
    // console.log('Button forced to show');
  }
};



//
//
//        SANKEY EDIT GUI FUNCTIONS
//
//

// Global snap-to-grid variables
window.snapToGrid = true; // Enabled by default
window.gridSize = 20;
window.gridOverlay = null;
window.dragTooltip = null;

// Function to update snap mode
function updateSnapMode() {
  const snapToggle = document.getElementById('snapToggle');
  const snapSizeInput = document.getElementById('snapSize');

  window.snapToGrid = snapToggle.checked;
  snapSizeInput.disabled = !snapToggle.checked;
}

// Function to update snap size
function updateSnapSize(size) {
  if (size && size > 0) {
    window.gridSize = size;
  }
}

// Function to snap coordinate to grid
function snapToGridCoordinate(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

// Function to create and show grid overlay
function showGridOverlay(config) {
  const svgElement = document.querySelector('#' + config.sankeyInstanceID + '_sankeySVGPARENT');
  if (!svgElement) return;

  // Remove existing grid overlay if it exists
  d3.select(svgElement).select('.grid-overlay').remove();
  d3.select(svgElement).select('#grid-pattern').remove();

  // Create defs if not exists
  let defs = d3.select(svgElement).select('defs');
  if (defs.empty()) {
    defs = d3.select(svgElement).append('defs');
  }

  // Create grid pattern
  const pattern = defs
    .append('pattern')
    .attr('id', 'grid-pattern')
    .attr('width', window.gridSize)
    .attr('height', window.gridSize)
    .attr('patternUnits', 'userSpaceOnUse');

  pattern.append('path')
    .attr('d', `M ${window.gridSize} 0 L 0 0 0 ${window.gridSize}`)
    .attr('fill', 'none')
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('opacity', 0.8);

  // Get SVG dimensions
  const svgRect = svgElement.getBoundingClientRect();
  const svgWidth = svgElement.getAttribute('width') || svgRect.width;
  const svgHeight = svgElement.getAttribute('height') || svgRect.height;

  // Create grid overlay rectangle
  window.gridOverlay = d3.select(svgElement)
    .append('rect')
    .attr('class', 'grid-overlay')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('fill', 'url(#grid-pattern)')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000);

  // Show the grid with animation
  window.gridOverlay
    .transition()
    .duration(300)
    .style('opacity', 0.5);
}

// Function to hide grid overlay
function hideGridOverlay() {
  if (window.gridOverlay) {
    window.gridOverlay
      .transition()
      .duration(300)
      .style('opacity', 0)
      .on('end', function () {
        // Remove the grid overlay after hiding
        d3.select(this).remove();
        window.gridOverlay = null;
      });
  }
}

// Function to create and show drag tooltip
function showDragTooltip(x, y, mouseX, mouseY, nodeData = null) {
  if (!window.dragTooltip) {
    window.dragTooltip = d3.select('body')
      .append('div')
      .attr('class', 'drag-tooltip')
      .style('position', 'absolute');
  }

  // Format coordinates (round to 1 decimal place)
  const displayX = Math.round(x * 10) / 10;
  const displayY = Math.round(y * 10) / 10;

  // Build tooltip content with node information if available
  let tooltipContent = `x: ${displayX}, y: ${displayY}`;
  
  if (nodeData) {
    const nodeId = nodeData.id || 'Unknown ID';
    const nodeTitle = nodeData.title || nodeData.name || 'Unknown Title';
    tooltipContent = `<strong>${nodeTitle}</strong><br>ID: ${nodeId}<br>${tooltipContent}`;
  }

  window.dragTooltip
    .html(tooltipContent)
    .style('left', (mouseX + 15) + 'px')
    .style('top', (mouseY - 10) + 'px')
    .classed('visible', true);
}

// Function to update drag tooltip position and content
function updateDragTooltip(x, y, mouseX, mouseY, nodeData = null) {
  if (window.dragTooltip) {
    // Format coordinates (round to 1 decimal place)
    const displayX = Math.round(x * 10) / 10;
    const displayY = Math.round(y * 10) / 10;

    // Build tooltip content with node information if available
    let tooltipContent = `x: ${displayX}, y: ${displayY}`;
    
    if (nodeData) {
      const nodeId = nodeData.id || 'Unknown ID';
      const nodeTitle = nodeData.title || nodeData.name || 'Unknown Title';
      tooltipContent = `<strong>${nodeTitle}</strong><br>ID: ${nodeId}<br>${tooltipContent}`;
    }

    window.dragTooltip
      .html(tooltipContent)
      .style('left', (mouseX + 15) + 'px')
      .style('top', (mouseY - 10) + 'px');
  }
}

// Function to hide drag tooltip
function hideDragTooltip() {
  if (window.dragTooltip) {
    window.dragTooltip
      .classed('visible', false)
      .transition()
      .delay(100)
      .style('opacity', 0)
      .on('end', function () {
        d3.select(this).remove();
        window.dragTooltip = null;
      });
  }
}

// ========================================
// EDITING FUNCTIONALITY
// ========================================

// Global variables for editing
let currentEditingLink = null;
let currentEditingNode = null;

// Popup management functions
window.closeEditPopup = function closeEditPopup() {
  // console.log('Closing all popups...');
  // 
  // Hide the popup overlay
  document.getElementById('editPopupContainer').style.display = 'none';
  
  // Hide all individual popups using class selector
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Reset editing state
  currentEditingLink = null;
  currentEditingNode = null;
}

window.openAddNodePopup = function openAddNodePopup() {
  // console.log('Opening add node popup...');
  
  // Hide any existing popups first
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Generate random default positions (rounded to nearest 10)
  const randomX = Math.round((Math.random() * 300 + 100) / 10) * 10; // Random between 100-900, rounded to 10s
  const randomY = Math.round((Math.random() * 300 + 100) / 10) * 10; // Random between 100-700, rounded to 10s
  
  // console.log('Generated random position:', { x: randomX, y: randomY });
  
  // Set random default values in the input fields
  document.getElementById('newNodeXInput').value = randomX;
  document.getElementById('newNodeYInput').value = randomY;
  
  // Show the popup overlay
  document.getElementById('editPopupContainer').style.display = 'flex';
  
  // Show the add node popup
  document.getElementById('addNodePopup').style.display = 'block';
}

window.openAddFlowPopup = function openAddFlowPopup() {
  // console.log('Opening add flow popup...');
  
  // Hide any existing popups first
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Populate dropdowns
  populateNodeSelects('newFlowSourceSelect', 'newFlowTargetSelect');
  populateLegendSelect('newFlowLegendSelect');
  
  // Show the popup overlay
  document.getElementById('editPopupContainer').style.display = 'flex';
  
  // Show the add flow popup
  document.getElementById('addFlowPopup').style.display = 'block';
}

window.openAddCarrierPopup = function openAddCarrierPopup() {
  // console.log('Opening add carrier popup...');
  
  // Hide any existing popups first
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Clear form fields
  document.getElementById('newCarrierIdInput').value = '';
  document.getElementById('newCarrierNameInput').value = '';
  document.getElementById('newCarrierColorInput').value = '#3498db';
  
  // Show the popup overlay
  document.getElementById('editPopupContainer').style.display = 'flex';
  
  // Show the add carrier popup
  document.getElementById('addCarrierPopup').style.display = 'block';
}

// Helper functions to populate dropdowns
function populateNodeSelects(sourceSelectId, targetSelectId) {
  const sourceSelect = document.getElementById(sourceSelectId);
  const targetSelect = document.getElementById(targetSelectId);
  
  // Clear existing options
  sourceSelect.innerHTML = '';
  targetSelect.innerHTML = '';
  
  // Get current nodes
  const nodes = window.nodesGlobal || [];
  
  nodes.forEach(node => {
    const option1 = document.createElement('option');
    option1.value = node.id;
    option1.textContent = `${node.title} (${node.id})`;
    sourceSelect.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = node.id;
    option2.textContent = `${node.title} (${node.id})`;
    targetSelect.appendChild(option2);
  });
}

function populateLegendSelect(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '';
  
  // Get current legend (check multiple sources)
  const legend = window.legend 
    || window.carriers 
    || (window.currentSankeyConfig && window.currentSankeyConfig.carriers)
    || (window.currentSankeyConfig && window.currentSankeyConfig.legend)
    || [];
  
  // Debug logging
  if (legend.length === 0) {
    console.warn('No legend/carriers data available to populate dropdown');
    console.warn('window.legend:', window.legend);
    console.warn('window.carriers:', window.carriers);
    console.warn('window.currentSankeyConfig?.carriers:', window.currentSankeyConfig?.carriers);
    console.warn('window.currentSankeyConfig?.legend:', window.currentSankeyConfig?.legend);
  }
  
  legend.forEach(legendItem => {
    const option = document.createElement('option');
    option.value = legendItem.id;
    option.textContent = legendItem.id;
    select.appendChild(option);
  });
}

// Link editing functions (make globally available)
window.editLink = function editLink(linkData, linkElement) {
  // console.log('=== EDIT LINK FUNCTION CALLED ===');
  // console.log('Full linkData object:', linkData);
  // console.log('linkData.legend:', linkData.legend);
  currentEditingLink = { data: linkData, element: linkElement };
  
  // Extract source and target IDs (they might be objects or strings)
  let sourceId, targetId;
  
  if (typeof linkData.source === 'object' && linkData.source.id) {
    sourceId = linkData.source.id;
  } else if (typeof linkData.source === 'string') {
    sourceId = linkData.source;
  } else {
    console.warn('Could not extract source ID from:', linkData.source);
    sourceId = '';
  }
  
  if (typeof linkData.target === 'object' && linkData.target.id) {
    targetId = linkData.target.id;
  } else if (typeof linkData.target === 'string') {
    targetId = linkData.target;
  } else {
    console.warn('Could not extract target ID from:', linkData.target);
    targetId = '';
  }
  
  // console.log('Extracted IDs - Source:', sourceId, 'Target:', targetId);
  
  // Store the extracted IDs for later use
  currentEditingLink.sourceId = sourceId;
  currentEditingLink.targetId = targetId;
  
  // Populate form fields
  document.getElementById('linkValueInput').value = linkData.value || 0;
  
  // Populate dropdowns
  populateNodeSelects('linkSourceSelect', 'linkTargetSelect');
  populateLegendSelect('linkLegendSelect');
  
  // Set current values using extracted IDs
  document.getElementById('linkSourceSelect').value = sourceId;
  document.getElementById('linkTargetSelect').value = targetId;
  
  // Set legend/carrier value with better logging and error handling
  const legendSelect = document.getElementById('linkLegendSelect');
  // Check for both 'carrier' (new) and 'legend' (old) properties
  const carrierValue = linkData.carrier || linkData.legend;
  // console.log('Setting carrier value from linkData.carrier or linkData.legend:', carrierValue);
  // console.log('linkData.carrier:', linkData.carrier, '| linkData.legend:', linkData.legend);
  // console.log('Available carrier options:', Array.from(legendSelect.options).map(o => o.value));
  
  if (carrierValue) {
    legendSelect.value = carrierValue;
    // console.log('After setting, legendSelect.value is:', legendSelect.value);
    // If value didn't set (option doesn't exist), log warning
    if (legendSelect.value !== carrierValue) {
      console.warn('Carrier type not found in options:', carrierValue);
      console.warn('This means the carrier "' + carrierValue + '" does not exist in the carriers list');
    }
  } else {
    console.warn('Both linkData.carrier and linkData.legend are empty or undefined');
  }
  
  document.getElementById('linkDirectionSelect').value = linkData.direction || 'r'; // Default to 'r' if not specified
  
  // Hide any existing popups first
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Show popup
  document.getElementById('editPopupContainer').style.display = 'flex';
  document.getElementById('linkEditPopup').style.display = 'block';
}

window.saveLinkEdit = function saveLinkEdit() {
  if (!currentEditingLink) return;
  
  const newSource = document.getElementById('linkSourceSelect').value;
  const newTarget = document.getElementById('linkTargetSelect').value;
  const newValue = parseFloat(document.getElementById('linkValueInput').value);
  const newLegend = document.getElementById('linkLegendSelect').value;
  const newDirection = document.getElementById('linkDirectionSelect').value;
  
  // console.log('=== SAVING LINK EDIT ===');
  // console.log('Original data:', currentEditingLink.data);
  // console.log('New values:', { newSource, newTarget, newValue, newLegend, newDirection });
  
  // Update the D3-bound data object
  currentEditingLink.data.source = newSource;
  currentEditingLink.data.target = newTarget;
  currentEditingLink.data.value = newValue;
  currentEditingLink.data.legend = newLegend; // Keep for backwards compatibility
  currentEditingLink.data.carrier = newLegend; // New property name
  currentEditingLink.data.direction = newDirection;
  
  // Also update the corresponding entry in window.links array
  if (window.links && Array.isArray(window.links)) {
    // console.log('Searching for matching link in global array...');
    // console.log('Looking for link with index:', currentEditingLink.data.index);
    // console.log('Total links in global array:', window.links.length);
    
    // First try to match by index (most reliable)
    let globalLinkIndex = -1;
    if (currentEditingLink.data.index !== undefined) {
      // Try direct index match
      if (currentEditingLink.data.index < window.links.length) {
        // console.log('Trying direct index match at:', currentEditingLink.data.index);
        const candidateLink = window.links[currentEditingLink.data.index];
        // console.log('Candidate link:', candidateLink);
        
        // Check if this link matches our source/target (use stored IDs)
        const sourceMatches = candidateLink['source.id'] === currentEditingLink.sourceId || 
                             candidateLink.source === currentEditingLink.sourceId;
        const targetMatches = candidateLink['target.id'] === currentEditingLink.targetId || 
                             candidateLink.target === currentEditingLink.targetId;
        
        if (sourceMatches && targetMatches) {
          globalLinkIndex = currentEditingLink.data.index;
          // console.log('Direct index match successful!');
        } else {
          // console.log('Direct index match failed - source/target mismatch');
        }
      }
    }
    
    // If index match failed, try to find by properties
    if (globalLinkIndex === -1) {
      // console.log('Trying property-based matching...');
      globalLinkIndex = window.links.findIndex((link, idx) => {
        const sourceMatches = link['source.id'] === currentEditingLink.sourceId || 
                             link.source === currentEditingLink.sourceId;
        const targetMatches = link['target.id'] === currentEditingLink.targetId || 
                             link.target === currentEditingLink.targetId;
        const valueMatches = Math.abs(link.value - currentEditingLink.data.value) < 0.001;
        
        const matches = sourceMatches && targetMatches && valueMatches;
        if (matches) {
          // console.log(`Property match found at index ${idx}:`, link);
        }
        return matches;
      });
    }
    
    if (globalLinkIndex > -1) {
      // console.log('Found matching link in global array at index:', globalLinkIndex);
      const originalLink = JSON.parse(JSON.stringify(window.links[globalLinkIndex]));
      
      // Update the global links array (preserve original property structure)
      if (window.links[globalLinkIndex]['source.id'] !== undefined) {
        window.links[globalLinkIndex]['source.id'] = newSource;
      }
      if (window.links[globalLinkIndex]['target.id'] !== undefined) {
        window.links[globalLinkIndex]['target.id'] = newTarget;
      }
      if (window.links[globalLinkIndex].source !== undefined) {
        window.links[globalLinkIndex].source = newSource;
      }
      if (window.links[globalLinkIndex].target !== undefined) {
        window.links[globalLinkIndex].target = newTarget;
      }
      
      window.links[globalLinkIndex].value = newValue;
      window.links[globalLinkIndex].legend = newLegend; // Keep for backwards compatibility
      window.links[globalLinkIndex].carrier = newLegend; // New property name
      window.links[globalLinkIndex].direction = newDirection;
      
      // console.log('Original link was:', originalLink);
      // console.log('Updated global link:', window.links[globalLinkIndex]);
    } else {
      console.warn('Could not find matching link in global array');
      // console.log('Available links (first 3):');
      window.links.slice(0, 3).forEach((link, idx) => {
        // console.log(`Link ${idx}:`, {
        //   'source.id': link['source.id'],
        //   'target.id': link['target.id'],
        //   source: link.source,
        //   target: link.target,
        //   value: link.value,
        //   legend: link.legend
        // });
      });
    }
  }
  
  // Also update sankeyDataObject if it exists
  if (window.sankeyDataObject && window.sankeyDataObject.links && currentEditingLink.data.index !== undefined) {
    const sankeyLink = window.sankeyDataObject.links[currentEditingLink.data.index];
    if (sankeyLink) {
      sankeyLink.source = newSource;
      sankeyLink.target = newTarget;
      sankeyLink.value = newValue;
      sankeyLink.legend = newLegend; // Keep for backwards compatibility
      sankeyLink.carrier = newLegend; // New property name (used in drawSankey)
      // console.log('Updated sankeyDataObject link:', sankeyLink);
    }
  }
  
  // console.log('Saved link changes:', currentEditingLink.data);
  
  // Close popup first
  closeEditPopup();
  
  // Refresh the diagram (with delay to avoid issues)
  setTimeout(() => {
    refreshDiagram();
  }, 100);
}

window.deleteLink = function deleteLink() {
  if (!currentEditingLink || !window.links) return;
  
  // console.log('=== DELETING LINK ===');
  // console.log('Deleting link with data:', currentEditingLink.data);
  // console.log('Original source ID:', currentEditingLink.sourceId);
  // console.log('Original target ID:', currentEditingLink.targetId);
  // console.log('Total links before deletion:', window.links.length);
  
  // Use the same matching logic as in saveLinkEdit for consistency
  let globalLinkIndex = -1;
  
  // First try to match by index (most reliable)
  if (currentEditingLink.data.index !== undefined) {
    // Try direct index match
    if (currentEditingLink.data.index < window.links.length) {
      // console.log('Trying direct index match at:', currentEditingLink.data.index);
      const candidateLink = window.links[currentEditingLink.data.index];
      // console.log('Candidate link for deletion:', candidateLink);
      
      // Check if this link matches our source/target (use stored IDs)
      const sourceMatches = candidateLink['source.id'] === currentEditingLink.sourceId || 
                           candidateLink.source === currentEditingLink.sourceId;
      const targetMatches = candidateLink['target.id'] === currentEditingLink.targetId || 
                           candidateLink.target === currentEditingLink.targetId;
      
      if (sourceMatches && targetMatches) {
        globalLinkIndex = currentEditingLink.data.index;
        // console.log('Direct index match successful for deletion!');
      } else {
        // console.log('Direct index match failed - source/target mismatch for deletion');
      }
    }
  }
  
  // If index match failed, try to find by properties
  if (globalLinkIndex === -1) {
    // console.log('Trying property-based matching for deletion...');
    globalLinkIndex = window.links.findIndex((link, idx) => {
      const sourceMatches = link['source.id'] === currentEditingLink.sourceId || 
                           link.source === currentEditingLink.sourceId;
      const targetMatches = link['target.id'] === currentEditingLink.targetId || 
                           link.target === currentEditingLink.targetId;
      const valueMatches = Math.abs(link.value - currentEditingLink.data.value) < 0.001;
      
      const matches = sourceMatches && targetMatches && valueMatches;
      if (matches) {
        // console.log(`Property match found for deletion at index ${idx}:`, link);
      }
      return matches;
    });
  }
  
  if (globalLinkIndex > -1) {
    const deletedLink = window.links[globalLinkIndex];
    window.links.splice(globalLinkIndex, 1);
    // console.log('Successfully deleted link at index', globalLinkIndex + ':', deletedLink);
    // console.log('Total links after deletion:', window.links.length);
    
    // Also remove from sankeyDataObject if it exists
    if (window.sankeyDataObject && window.sankeyDataObject.links && currentEditingLink.data.index !== undefined) {
      const sankeyLinkIndex = window.sankeyDataObject.links.findIndex(link => 
        link.index === currentEditingLink.data.index
      );
      
      if (sankeyLinkIndex > -1) {
        const deletedSankeyLink = window.sankeyDataObject.links[sankeyLinkIndex];
        window.sankeyDataObject.links.splice(sankeyLinkIndex, 1);
        // console.log('Also removed link from sankeyDataObject:', deletedSankeyLink);
      }
    }
    
    // Close popup first
    closeEditPopup();
    
    // Refresh the diagram (with delay to avoid issues)
    setTimeout(() => {
      refreshDiagram();
    }, 100);
  } else {
    console.warn('Could not find link to delete in global array');
    // console.log('Available links (first 3):');
    window.links.slice(0, 3).forEach((link, idx) => {
      // console.log(`Link ${idx}:`, {
      //   'source.id': link['source.id'],
      //   'target.id': link['target.id'],
      //   source: link.source,
      //   target: link.target,
      //   value: link.value,
      //   legend: link.legend
      // });
    });
    closeEditPopup();
  }
}

// Node editing functions (make globally available)
window.editNode = function editNode(nodeData, nodeElement) {
  // console.log('=== EDIT NODE FUNCTION CALLED ===');
  // console.log('Editing node:', nodeData);
  currentEditingNode = { data: nodeData, element: nodeElement };
  
  // Extract node properties (handle different data structures)
  let nodeId, nodeTitle, nodeX, nodeY;
  
  // Handle ID extraction
  if (nodeData.id !== undefined) {
    nodeId = nodeData.id;
  } else {
    console.warn('Could not extract node ID from:', nodeData);
    nodeId = '';
  }
  
  // Handle title extraction
  if (nodeData.title !== undefined) {
    nodeTitle = nodeData.title;
  } else if (nodeData.name !== undefined) {
    nodeTitle = nodeData.name;
  } else {
    console.warn('Could not extract node title from:', nodeData);
    nodeTitle = '';
  }
  
  // Handle position extraction
  nodeX = nodeData.x || nodeData.x0 || 0;
  nodeY = nodeData.y || nodeData.y0 || 0;
  
  // console.log('Extracted node properties - ID:', nodeId, 'Title:', nodeTitle, 'Position:', nodeX, nodeY);
  
  // Store the extracted values for later use
  currentEditingNode.originalId = nodeId;
  currentEditingNode.originalTitle = nodeTitle;
  currentEditingNode.originalX = nodeX;
  currentEditingNode.originalY = nodeY;
  
  // Populate form fields
  document.getElementById('nodeIdInput').value = nodeId;
  document.getElementById('nodeNameInput').value = nodeTitle;
  document.getElementById('nodeXInput').value = nodeX;
  document.getElementById('nodeYInput').value = nodeY;
  document.getElementById('nodeLabelPositionSelect').value = nodeData.labelposition || 'right'; // Default to 'right' if not specified
  document.getElementById('nodeDirectionSelect').value = nodeData.direction || 'r'; // Default to 'r' if not specified
  
  // Hide any existing popups first
  const allPopups = document.querySelectorAll('.edit-popup');
  allPopups.forEach(popup => {
    popup.style.display = 'none';
  });
  
  // Show popup
  document.getElementById('editPopupContainer').style.display = 'flex';
  document.getElementById('nodeEditPopup').style.display = 'block';
}

window.saveNodeEdit = function saveNodeEdit() {
  if (!currentEditingNode) return;
  
  const newId = document.getElementById('nodeIdInput').value.trim();
  const newName = document.getElementById('nodeNameInput').value.trim();
  const newX = parseFloat(document.getElementById('nodeXInput').value);
  const newY = parseFloat(document.getElementById('nodeYInput').value);
  const newLabelPosition = document.getElementById('nodeLabelPositionSelect').value;
  const newDirection = document.getElementById('nodeDirectionSelect').value;
  
  if (!newId || !newName) {
    alert('Please provide both Node ID and Node Name');
    return;
  }
  
  // console.log('=== SAVING NODE EDIT ===');
  // console.log('Original node data:', currentEditingNode.data);
  // console.log('New values:', { newId, newName, newX, newY, newLabelPosition, newDirection });
  // console.log('Original extracted values:', {
  //   id: currentEditingNode.originalId,
  //   title: currentEditingNode.originalTitle,
  //   x: currentEditingNode.originalX,
  //   y: currentEditingNode.originalY
  // });
  
  // Update the D3-bound data object
  currentEditingNode.data.id = newId;
  currentEditingNode.data.title = newName;
  currentEditingNode.data.x = newX;
  currentEditingNode.data.y = newY;
  currentEditingNode.data.labelposition = newLabelPosition;
  currentEditingNode.data.direction = newDirection;
  // Also update position properties that might be used by D3
  if (currentEditingNode.data.x0 !== undefined) {
    currentEditingNode.data.x0 = newX;
  }
  if (currentEditingNode.data.y0 !== undefined) {
    currentEditingNode.data.y0 = newY;
  }
  
  // Update the corresponding entry in window.nodesGlobal array
  if (window.nodesGlobal && Array.isArray(window.nodesGlobal)) {
    // console.log('Searching for matching node in global array...');
    // console.log('Looking for node with original ID:', currentEditingNode.originalId);
    // console.log('Total nodes in global array:', window.nodesGlobal.length);
    
    // Find the matching node in the global array
    const globalNodeIndex = window.nodesGlobal.findIndex(node => {
      // Try to match by original ID
      return node.id === currentEditingNode.originalId;
    });
    
    if (globalNodeIndex > -1) {
      // console.log('Found matching node in global array at index:', globalNodeIndex);
      const originalNode = JSON.parse(JSON.stringify(window.nodesGlobal[globalNodeIndex]));
      
      // Update the global nodes array
      window.nodesGlobal[globalNodeIndex].id = newId;
      window.nodesGlobal[globalNodeIndex].title = newName;
      window.nodesGlobal[globalNodeIndex].x = newX;
      window.nodesGlobal[globalNodeIndex].y = newY;
      window.nodesGlobal[globalNodeIndex].labelposition = newLabelPosition;
      window.nodesGlobal[globalNodeIndex].direction = newDirection;
      
      // Also update alternative property names if they exist
      if (window.nodesGlobal[globalNodeIndex].name !== undefined) {
        window.nodesGlobal[globalNodeIndex].name = newName;
      }
      if (window.nodesGlobal[globalNodeIndex].x0 !== undefined) {
        window.nodesGlobal[globalNodeIndex].x0 = newX;
      }
      if (window.nodesGlobal[globalNodeIndex].y0 !== undefined) {
        window.nodesGlobal[globalNodeIndex].y0 = newY;
      }
      
      // console.log('Original node was:', originalNode);
      // console.log('Updated global node:', window.nodesGlobal[globalNodeIndex]);
    } else {
      console.warn('Could not find matching node in global array');
      // console.log('Available nodes (first 3):');
      window.nodesGlobal.slice(0, 3).forEach((node, idx) => {
        // console.log(`Node ${idx}:`, {
        //   id: node.id,
        //   title: node.title,
        //   name: node.name,
        //   x: node.x,
        //   y: node.y
        // });
      });
    }
  }
  
  // Also update sankeyDataObject if it exists
  if (window.sankeyDataObject && window.sankeyDataObject.nodes) {
    const sankeyNodeIndex = window.sankeyDataObject.nodes.findIndex(node => 
      node.id === currentEditingNode.originalId
    );
    
    if (sankeyNodeIndex > -1) {
      const sankeyNode = window.sankeyDataObject.nodes[sankeyNodeIndex];
      sankeyNode.id = newId;
      sankeyNode.title = newName;
      sankeyNode.x = newX;
      sankeyNode.y = newY;
      // Update position properties
      if (sankeyNode.x0 !== undefined) sankeyNode.x0 = newX;
      if (sankeyNode.y0 !== undefined) sankeyNode.y0 = newY;
      // console.log('Updated sankeyDataObject node:', sankeyNode);
    }
  }
  
  // If the node ID changed, we need to update all links that reference this node
  if (newId !== currentEditingNode.originalId) {
    // console.log('Node ID changed, updating link references...');
    
    // Update window.links
    if (window.links && Array.isArray(window.links)) {
      window.links.forEach((link, idx) => {
        let updated = false;
        if (link['source.id'] === currentEditingNode.originalId) {
          link['source.id'] = newId;
          updated = true;
        }
        if (link['target.id'] === currentEditingNode.originalId) {
          link['target.id'] = newId;
          updated = true;
        }
        if (link.source === currentEditingNode.originalId) {
          link.source = newId;
          updated = true;
        }
        if (link.target === currentEditingNode.originalId) {
          link.target = newId;
          updated = true;
        }
        if (updated) {
          // console.log(`Updated link ${idx} references`);
        }
      });
    }
    
    // Update sankeyDataObject.links
    if (window.sankeyDataObject && window.sankeyDataObject.links) {
      window.sankeyDataObject.links.forEach((link, idx) => {
        let updated = false;
        if (link.source === currentEditingNode.originalId) {
          link.source = newId;
          updated = true;
        }
        if (link.target === currentEditingNode.originalId) {
          link.target = newId;
          updated = true;
        }
        if (updated) {
          // console.log(`Updated sankeyDataObject link ${idx} references`);
        }
      });
    }
  }
  
  // console.log('Saved node changes:', currentEditingNode.data);
  
  // Close popup first
  closeEditPopup();
  
  // Refresh the diagram (with delay to avoid issues)
  setTimeout(() => {
    refreshDiagram();
  }, 100);
}

window.deleteNode = function deleteNode() {
  if (!currentEditingNode || !window.nodesGlobal) return;
  
  // console.log('=== DELETING NODE ===');
  // console.log('Deleting node with original ID:', currentEditingNode.originalId);
  
  // Find and remove the node using original ID
  const nodeIndex = window.nodesGlobal.findIndex(node => 
    node.id === currentEditingNode.originalId
  );
  
  if (nodeIndex > -1) {
    const deletedNode = window.nodesGlobal[nodeIndex];
    window.nodesGlobal.splice(nodeIndex, 1);
    // console.log('Removed node from global array:', deletedNode);
    
    // Also remove any links that reference this node
    if (window.links) {
      const originalLinkCount = window.links.length;
      window.links = window.links.filter(link => 
        link['source.id'] !== currentEditingNode.originalId && 
        link['target.id'] !== currentEditingNode.originalId &&
        link.source !== currentEditingNode.originalId && 
        link.target !== currentEditingNode.originalId
      );
      const removedLinkCount = originalLinkCount - window.links.length;
      // console.log(`Removed ${removedLinkCount} links that referenced the deleted node`);
    }
    
    // Remove from sankeyDataObject as well
    if (window.sankeyDataObject) {
      if (window.sankeyDataObject.nodes) {
        const sankeyNodeIndex = window.sankeyDataObject.nodes.findIndex(node => 
          node.id === currentEditingNode.originalId
        );
        if (sankeyNodeIndex > -1) {
          window.sankeyDataObject.nodes.splice(sankeyNodeIndex, 1);
          // console.log('Removed node from sankeyDataObject');
        }
      }
      
      if (window.sankeyDataObject.links) {
        const originalSankeyLinkCount = window.sankeyDataObject.links.length;
        window.sankeyDataObject.links = window.sankeyDataObject.links.filter(link => 
          link.source !== currentEditingNode.originalId && 
          link.target !== currentEditingNode.originalId
        );
        const removedSankeyLinkCount = originalSankeyLinkCount - window.sankeyDataObject.links.length;
        // console.log(`Removed ${removedSankeyLinkCount} links from sankeyDataObject`);
      }
    }
    
    // console.log('Node deletion completed');
    
    // Close popup first
    closeEditPopup();
    
    // Refresh the diagram (with delay to avoid issues)
    setTimeout(() => {
      refreshDiagram();
    }, 100);
  } else {
    console.warn('Could not find node to delete in global array');
    closeEditPopup();
  }
}

// Add new node/flow functions
window.saveNewNode = function saveNewNode() {
  const newId = document.getElementById('newNodeIdInput').value.trim();
  const newName = document.getElementById('newNodeNameInput').value.trim();
  const newX = parseFloat(document.getElementById('newNodeXInput').value);
  const newY = parseFloat(document.getElementById('newNodeYInput').value);
  
  if (!newId || !newName) {
    alert('Please provide both Node ID and Node Name');
    return;
  }
  
  // console.log('=== ADDING NEW NODE ===');
  // console.log('New node values:', { newId, newName, newX, newY });
  
  // Check if ID already exists
  if (window.nodesGlobal && window.nodesGlobal.find(node => node.id === newId)) {
    alert('A node with this ID already exists');
    return;
  }
  
  // Create new node with comprehensive properties
  const newNode = {
    id: newId,
    title: newName,
    name: newName,     // Alternative property name
    x: newX,
    y: newY,
    x0: newX,          // D3 position properties
    y0: newY,
    value: 0,          // Will be calculated based on flows
    column: 0,         // Will be determined by position
    cluster: 0,        // Required by processData - default to 0
    row: 0,            // Required by processData - default to 0
    direction: 'right', // Required by processData - default direction
    labelposition: 'right', // Required by processData - default label position
    dummy: false       // Required by processData - not a dummy node
  };
  
  // Add to nodes array
  if (!window.nodesGlobal) window.nodesGlobal = [];
  window.nodesGlobal.push(newNode);
  // console.log('Added to window.nodesGlobal. Total nodes:', window.nodesGlobal.length);
  
  // Also add to sankeyDataObject if it exists
  if (window.sankeyDataObject) {
    if (!window.sankeyDataObject.nodes) window.sankeyDataObject.nodes = [];
    window.sankeyDataObject.nodes.push({...newNode});
    // console.log('Added to sankeyDataObject.nodes. Total nodes:', window.sankeyDataObject.nodes.length);
  }
  
  // console.log('Added new node:', newNode);
  
  // Close popup first
  closeEditPopup();
  
  // Refresh the diagram (with delay to avoid issues)
  setTimeout(() => {
    refreshDiagram();
  }, 100);
}

window.saveNewFlow = function saveNewFlow() {
  const newSource = document.getElementById('newFlowSourceSelect').value;
  const newTarget = document.getElementById('newFlowTargetSelect').value;
  const newValue = parseFloat(document.getElementById('newFlowValueInput').value);
  const newLegend = document.getElementById('newFlowLegendSelect').value;
  
  if (!newSource || !newTarget || !newLegend) {
    alert('Please fill in all fields');
    return;
  }
  
  if (newSource === newTarget) {
    alert('Source and target cannot be the same');
    return;
  }
  
  // console.log('=== ADDING NEW FLOW ===');
  // console.log('New flow values:', { newSource, newTarget, newValue, newLegend });
  
  // Create new link with comprehensive properties to match existing structure
  const newLink = {
    'source.id': newSource,  // Property-based format
    'target.id': newTarget,
    source: newSource,       // Direct property format
    target: newTarget,
    value: newValue,
    legend: newLegend,       // Keep for backwards compatibility
    carrier: newLegend,      // New property name
    type: 0,                 // Default type
    visibility: 1            // Visible by default
  };
  
  // Add to links array
  if (!window.links) window.links = [];
  window.links.push(newLink);
  // console.log('Added to window.links. Total links:', window.links.length);
  
  // Also add to sankeyDataObject if it exists
  if (window.sankeyDataObject) {
    if (!window.sankeyDataObject.links) window.sankeyDataObject.links = [];
    
    // Get color for the legend
    let color = '#999'; // Default color
    const legendData = window.legend || window.carriers;
    if (legendData) {
      const legendItem = legendData.find(item => item.id === newLegend);
      if (legendItem) {
        color = legendItem.color;
      }
    }
    
    const sankeyLink = {
      index: window.sankeyDataObject.links.length,
      source: newSource,
      target: newTarget,
      value: newValue,
      legend: newLegend,       // Keep for backwards compatibility
      carrier: newLegend,      // New property name (used in drawSankey)
      color: color,
      type: 0,
      visibility: 1
    };
    
    window.sankeyDataObject.links.push(sankeyLink);
    // console.log('Added to sankeyDataObject.links. Total links:', window.sankeyDataObject.links.length);
  }
  
  // console.log('Added new flow:', newLink);
  
  // Close popup first
  closeEditPopup();
  
  // Refresh the diagram (with delay to avoid issues)
  setTimeout(() => {
    refreshDiagram();
  }, 100);
}

window.saveNewCarrier = function saveNewCarrier() {
  // console.log('=== SAVE NEW CARRIER FUNCTION CALLED ===');
  // console.log('Call stack:', new Error().stack);
  
  // Check if the popup is actually visible (safety check)
  const popup = document.getElementById('addCarrierPopup');
  if (!popup || popup.style.display === 'none') {
    console.warn('saveNewCarrier called but popup is not visible - ignoring call');
    return;
  }
  
  const newId = document.getElementById('newCarrierIdInput').value.trim();
  const newName = document.getElementById('newCarrierNameInput').value.trim();
  const newColor = document.getElementById('newCarrierColorInput').value;
  
  // console.log('=== ADDING NEW CARRIER ===');
  // console.log('New carrier values:', { newId, newName, newColor });
  
  if (!newId || !newName) {
    alert('Please fill in both Carrier Name (ID) and Display Name');
    return;
  }
  
  // Check if carrier ID already exists
  const existingItem = window.legend && window.legend.find(item => item.id === newId);
  if (existingItem) {
    // console.log('Found existing carrier with same ID:', existingItem);
    alert('A carrier with this ID already exists');
    return;
  }
  
  // console.log('No existing carrier found with ID:', newId);
  
  // Create new legend entry
  const newLegendItem = {
    id: newId,
    name: newName,
    color: newColor
  };
  
  // Add to legend array
  if (!window.legend) window.legend = [];
  window.legend.push(newLegendItem);
  // console.log('Added to window.legend. Total legend entries:', window.legend.length);
  
  // Update currentSankeyConfig if it exists - keep both arrays in sync
  if (window.currentSankeyConfig) {
    if (!window.currentSankeyConfig.legend) {
      window.currentSankeyConfig.legend = [];
    }
    // Instead of pushing, replace the entire array to ensure sync
    window.currentSankeyConfig.legend = [...window.legend];
    // console.log('Synchronized currentSankeyConfig.legend with window.legend');
  }
  
  // console.log('Added new carrier:', newLegendItem);
  
  // Close popup first
  closeEditPopup();
  
  // Regenerate legend color controls to show the new carrier
  setTimeout(() => {
    generateLegendColorControls();
  }, 100);
}

// Function to refresh the entire diagram
function refreshDiagram() {
  // console.log('=== REFRESH DIAGRAM DEBUG ===');
  // console.log('processData available:', typeof window.processData);
  // console.log('nodesGlobal available:', !!window.nodesGlobal, window.nodesGlobal ? window.nodesGlobal.length : 'N/A');
  // console.log('links available:', !!window.links, window.links ? window.links.length : 'N/A');
  // console.log('legend available:', !!window.legend, window.legend ? window.legend.length : 'N/A');
  // console.log('settings available:', !!window.settings, window.settings ? window.settings.length : 'N/A');
  // console.log('remarks available:', !!window.remarks, window.remarks ? window.remarks.length : 'N/A');
  // console.log('currentSankeyConfig available:', !!window.currentSankeyConfig);
  
  const carriersData = window.legend || window.carriers;
  if (window.processData && window.nodesGlobal && window.links && carriersData && window.settings && window.remarks && window.currentSankeyConfig) {
    // console.log('All data available, proceeding with refresh...');
    
    try {
      // Check and fix missing legend entries before refresh
      if (typeof window.checkAndFixLegendEntries === 'function') {
        window.checkAndFixLegendEntries();
      }
      
      // Create a fresh copy of the data
      const freshLinksData = JSON.parse(JSON.stringify(window.links));
      // console.log('Fresh links data created, length:', freshLinksData.length);
      
      // Update current processed links data to preserve edits
      window.currentProcessedLinksData = JSON.parse(JSON.stringify(freshLinksData));
      
      // Reset the selectionButtonsHaveInitialized flag so buttons get redrawn
      window.selectionButtonsHaveInitialized = false;
      
      // Try different refresh approaches
      // console.log('Calling processData...');
      
      // First try: use processData if available
      if (typeof window.processData === 'function') {
        window.processData(freshLinksData, window.nodesGlobal, carriersData, window.settings, window.remarks, window.currentSankeyConfig);
      }
      // Fallback: try direct diagram redraw
      else if (typeof window.drawSankey === 'function' && window.sankeyDataObject) {
        // console.log('Using fallback drawSankey approach...');
        // Update the sankeyDataObject with new data
        window.sankeyDataObject.links = freshLinksData;
        window.sankeyDataObject.nodes = window.nodesGlobal;
        window.drawSankey(window.sankeyDataObject, window.currentSankeyConfig);
      }
      // Another fallback: try updateSankey if available
      else if (typeof window.updateSankey === 'function') {
        // console.log('Using updateSankey approach...');
        const jsonData = JSON.stringify({
          links: freshLinksData,
          nodes: window.nodesGlobal
        });
        window.updateSankey(jsonData, 0, 0, 12, 'Arial', window.currentSankeyConfig);
      }
      else {
        throw new Error('No viable refresh method available');
      }
      
      // console.log('Diagram refreshed successfully');
      
      // Check node balance after diagram refresh
      setTimeout(() => {
        if (typeof window.checkNodeBalance === 'function') {
          window.checkNodeBalance();
        }
      }, 500); // Give the diagram time to fully render
        
        // Re-check event listeners after refresh
      setTimeout(() => {
        debugAttachEventListeners();
      }, 500);
      
    } catch (error) {
      console.error('Error refreshing diagram:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  } else {
    console.error('Cannot refresh diagram - missing required data or functions');
    console.error('Missing items:', {
      processData: !window.processData,
      nodesGlobal: !window.nodesGlobal,
      links: !window.links,
      legend: !window.legend,
      settings: !window.settings,
      remarks: !window.remarks,
      currentSankeyConfig: !window.currentSankeyConfig
    });
  }
}

// Function to ensure event listeners are attached
window.debugAttachEventListeners = function debugAttachEventListeners() {
  // console.log('=== ATTACHING EVENT LISTENERS ===');
  
  // Wait for DOM to be ready
  setTimeout(() => {
    const sankeyContainer = document.querySelector('#energyflows_sankeySVGPARENT');
    // console.log('Sankey container found:', !!sankeyContainer);
    
    if (sankeyContainer) {
      // Find all link elements
      const links = sankeyContainer.querySelectorAll('.link');
      const linkPaths = sankeyContainer.querySelectorAll('.link path');
      const nodes = sankeyContainer.querySelectorAll('.node');
      const nodeClickTargets = sankeyContainer.querySelectorAll('.node-click-target');
      
      // console.log(`Found ${links.length} link groups, ${linkPaths.length} link paths`);
      // console.log(`Found ${nodes.length} node groups, ${nodeClickTargets.length} node click targets`);
      
      // Always attach event listeners to ensure they work
      // console.log('Attaching event listeners to ensure functionality...');
      
      // Attach click listeners to link paths (don't remove existing ones)
      linkPaths.forEach((linkPath, index) => {
        linkPath.style.cursor = 'pointer';
        linkPath.style.pointerEvents = 'all';
        
        linkPath.addEventListener('click', function(event) {
          // console.log('=== LINK CLICK ===', event);
          event.stopPropagation();
          
          // Try to get D3 data
          const d3Data = this.__data__;
          // console.log('D3 data:', d3Data);
          
          if (d3Data) {
            window.editLink(d3Data, this);
          } else {
            // console.log('No D3 data found on link element');
            // Try to find data from parent link group
            const linkGroup = this.closest('.link');
            if (linkGroup && linkGroup.__data__) {
              // console.log('Found D3 data on parent link group');
              window.editLink(linkGroup.__data__, linkGroup);
            }
          }
        });
      });
      
      // Attach click listeners to nodes
      nodes.forEach((node, index) => {
        node.style.cursor = 'pointer';
        
        node.addEventListener('click', function(event) {
          // console.log('=== NODE CLICK ===', event);
          
          if (event.shiftKey) {
            event.stopPropagation();
            
            // Try to get D3 data
            const d3Data = this.__data__;
            // console.log('D3 data:', d3Data);
            
            if (d3Data) {
              window.editNode(d3Data, this);
            } else {
              // console.log('No D3 data found on node element');
            }
          }
        });
      });
      
      // console.log(`Event listeners attached to ${linkPaths.length} links and ${nodes.length} nodes`);
    }
  }, 1000);
}

// Call this function automatically
window.addEventListener('load', () => {
  window.debugAttachEventListeners();
});

// Force re-attachment of event listeners (can be called from console)
window.forceAttachEventListeners = function() {
  // console.log('=== FORCING EVENT LISTENER ATTACHMENT ===');
  window.debugAttachEventListeners();
};

// Debug function to check current data state (can be called from console)
window.debugExportData = function() {
  // console.log('=== CURRENT DATA STATE DEBUG ===');
  // console.log('window.nodesGlobal:', window.nodesGlobal ? window.nodesGlobal.length + ' nodes' : 'NOT AVAILABLE');
  // console.log('window.links:', window.links ? window.links.length + ' links' : 'NOT AVAILABLE');
  // console.log('window.originalLinksData:', window.originalLinksData ? window.originalLinksData.length + ' original links' : 'NOT AVAILABLE');
  // console.log('sankeyDataObject:', sankeyDataObject ? 'AVAILABLE' : 'NOT AVAILABLE');
  if (sankeyDataObject) {
    // console.log('sankeyDataObject.nodes:', sankeyDataObject.nodes ? sankeyDataObject.nodes.length + ' nodes' : 'NOT AVAILABLE');
    // console.log('sankeyDataObject.links:', sankeyDataObject.links ? sankeyDataObject.links.length + ' links' : 'NOT AVAILABLE');
  }
  // console.log('window.legend:', window.legend ? window.legend.length + ' legend entries' : 'NOT AVAILABLE');
  // console.log('window.settings:', window.settings ? window.settings.length + ' settings' : 'NOT AVAILABLE');
  
  // Show sample data
  if (window.nodesGlobal && window.nodesGlobal.length > 0) {
    // console.log('Sample node from window.nodesGlobal:', window.nodesGlobal[window.nodesGlobal.length - 1]);
  }
  if (window.links && window.links.length > 0) {
    // console.log('Sample link from window.links:', window.links[window.links.length - 1]);
  }
  
  return {
    nodesCount: window.nodesGlobal ? window.nodesGlobal.length : 0,
    linksCount: window.links ? window.links.length : 0,
    originalLinksCount: window.originalLinksData ? window.originalLinksData.length : 0,
    legendCount: window.legend ? window.legend.length : 0,
    settingsCount: window.settings ? window.settings.length : 0
  };
};

// Debug function to check legend state and potential issues
window.debugLegendState = function() {
  // console.log('=== LEGEND DEBUG STATE ===');
  // console.log('window.legend:', window.legend);
  if (window.legend && Array.isArray(window.legend)) {
    // console.log('Legend entries:');
    window.legend.forEach((item, index) => {
      // console.log(`  ${index}: ID="${item.id}", Name="${item.name}", Color="${item.color}"`);
    });
    
    // Check for duplicates
    const ids = window.legend.map(item => item.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn('DUPLICATE IDs FOUND:', duplicates);
    } else {
      // console.log('No duplicate IDs found');
    }
  }
  
  // Check popup states
  // console.log('Add Carrier Popup visible:', document.getElementById('addCarrierPopup')?.style.display !== 'none');
  // console.log('Edit Popup Container visible:', document.getElementById('editPopupContainer')?.style.display !== 'none');
  
  return {
    legendCount: window.legend ? window.legend.length : 0,
    legendIds: window.legend ? window.legend.map(item => item.id) : [],
    duplicates: window.legend ? window.legend.map(item => item.id).filter((id, index, arr) => arr.indexOf(id) !== index) : []
  };
};

// Function to purge unused carrier items
window.purgeUnusedCarrierItems = function purgeUnusedCarrierItems() {
  // console.log('=== PURGING UNUSED LEGEND ITEMS ===');
  
  const legendData = window.legend || window.carriers;
  if (!legendData || !Array.isArray(legendData)) {
    alert('No carrier data found');
    return;
  }
  
  if (!window.links || !Array.isArray(window.links)) {
    alert('No links data found');
    return;
  }
  
  // Get all carrier types currently used by links (check both property names)
  const usedLegendTypes = new Set();
  window.links.forEach(link => {
    const carrierType = link.carrier || link.legend;
    if (carrierType) {
      usedLegendTypes.add(carrierType);
    }
  });
  
  // Also check sankeyDataObject links if available
  if (window.sankeyDataObject && window.sankeyDataObject.links) {
    window.sankeyDataObject.links.forEach(link => {
      const carrierType = link.carrier || link.legend;
      if (carrierType) {
        usedLegendTypes.add(carrierType);
      }
    });
  }
  
  // console.log('Used legend types:', Array.from(usedLegendTypes));
  // console.log('Total legend items before purge:', legendData.length);
  
  // Find unused legend items
  const unusedItems = legendData.filter(legendItem => 
    !usedLegendTypes.has(legendItem.id)
  );
  
  // console.log('Unused legend items found:', unusedItems);
  
  if (unusedItems.length === 0) {
    alert('No unused carrier items found. All carrier items are currently in use.');
    return;
  }
  
  // Show confirmation dialog
  const unusedNames = unusedItems.map(item => item.id).join(', ');
  const confirmMessage = `Found ${unusedItems.length} unused carrier item(s):\n\n${unusedNames}\n\nDo you want to remove these unused items?`;
  
  if (!confirm(confirmMessage)) {
    // console.log('Purge cancelled by user');
    return;
  }
  
  // Remove unused items (update both window.legend and window.carriers)
  const usedItems = legendData.filter(legendItem => 
    usedLegendTypes.has(legendItem.id)
  );
  
  // console.log('Keeping', usedItems.length, 'used legend items');
  if (window.legend) window.legend = usedItems;
  if (window.carriers) window.carriers = usedItems;
  
  // Also update currentSankeyConfig.legend and carriers if they exist
  if (window.currentSankeyConfig && window.currentSankeyConfig.legend) {
    window.currentSankeyConfig.legend = window.currentSankeyConfig.legend.filter(legendItem =>
      usedLegendTypes.has(legendItem.id)
    );
    // console.log('Updated currentSankeyConfig.legend');
  }
  if (window.currentSankeyConfig && window.currentSankeyConfig.carriers) {
    window.currentSankeyConfig.carriers = window.currentSankeyConfig.carriers.filter(carrierItem =>
      usedLegendTypes.has(carrierItem.id)
    );
    // console.log('Updated currentSankeyConfig.carriers');
  }
  
  // console.log('Total legend items after purge:', window.legend.length);
  // console.log('Removed', unusedItems.length, 'unused legend items');
  
  // Regenerate legend color controls to reflect the changes
  setTimeout(() => {
    generateLegendColorControls();
    // console.log('Legend color controls regenerated');
  }, 100);
  
  // Show success message
  const successMessage = `Successfully removed ${unusedItems.length} unused carrier item(s):\n${unusedNames}\n\nNote: These changes will be reflected in future Excel exports.`;
  alert(successMessage);
  
  // console.log('Purge completed. Legend items have been removed from:');
  // console.log('- window.legend (used by Excel export)');
  // console.log('- window.currentSankeyConfig.legend (if exists)');
  // console.log('- Control panel UI (regenerated)');
  // console.log('Next Excel export will only include the remaining', window.legend.length, 'legend items');
};

// Function to purge unused nodes
window.purgeUnusedNodes = function purgeUnusedNodes() {
  // console.log('=== PURGING UNUSED NODES ===');
  
  if (!window.nodesGlobal || !Array.isArray(window.nodesGlobal)) {
    alert('No node data found');
    return;
  }
  
  if (!window.links || !Array.isArray(window.links)) {
    alert('No link data found');
    return;
  }
  
  // Get all node IDs that are referenced in links (either as source or target)
  const usedNodeIds = new Set();
  
  window.links.forEach(link => {
    // Check various possible source/target field names
    const sourceId = link['source.id'] || link.source?.id || link.source;
    const targetId = link['target.id'] || link.target?.id || link.target;
    
    if (sourceId) usedNodeIds.add(sourceId);
    if (targetId) usedNodeIds.add(targetId);
  });
  
  // console.log('Node IDs used in links:', Array.from(usedNodeIds));
  // console.log('Total nodes before purge:', window.nodesGlobal.length);
  
  // Find unused nodes
  const unusedNodes = window.nodesGlobal.filter(node => {
    const nodeId = node.id;
    return !usedNodeIds.has(nodeId);
  });
  
  // console.log('Unused nodes found:', unusedNodes);
  
  if (unusedNodes.length === 0) {
    alert('No unused nodes found. All nodes are connected to at least one flow.');
    return;
  }
  
  // Create confirmation message with node details
  const unusedNames = unusedNodes.map(node => `• ${node.title || node.name || node.id}`).join('\n');
  const confirmMessage = `Found ${unusedNodes.length} unused node(s) that are not connected to any flows:\n\n${unusedNames}\n\nDo you want to remove these nodes?\n\nNote: This action cannot be undone and will be reflected in future Excel exports.`;
  
  if (!confirm(confirmMessage)) {
    // console.log('Purge cancelled by user');
    return;
  }
  
  // Keep only used nodes
  const usedNodes = window.nodesGlobal.filter(node => {
    const nodeId = node.id;
    return usedNodeIds.has(nodeId);
  });
  
  // console.log('Keeping', usedNodes.length, 'used nodes');
  window.nodesGlobal = usedNodes;
  
  // Also update sankeyDataObject.nodes if it exists
  if (window.sankeyDataObject && window.sankeyDataObject.nodes) {
    window.sankeyDataObject.nodes = window.sankeyDataObject.nodes.filter(node => {
      const nodeId = node.id;
      return usedNodeIds.has(nodeId);
    });
    // console.log('Updated sankeyDataObject.nodes');
  }
  
  // console.log('Total nodes after purge:', window.nodesGlobal.length);
  // console.log('Removed', unusedNodes.length, 'unused nodes');
  
  // Show success message
  const successMessage = `Successfully removed ${unusedNodes.length} unused node(s):\n${unusedNames}\n\nNote: These changes will be reflected in future Excel exports.`;
  alert(successMessage);
  
  // Refresh the diagram to reflect the changes
  setTimeout(() => {
    if (typeof refreshDiagram === 'function') {
      refreshDiagram();
      // console.log('Diagram refreshed after node purge');
    }
  }, 100);
  
  // console.log('Purge completed. Unused nodes have been removed from:');
  // console.log('- window.nodesGlobal (used by Excel export)');
  // console.log('- window.sankeyDataObject.nodes (if exists)');
  // console.log('- Diagram will be refreshed');
  // console.log('Next Excel export will only include the remaining', window.nodesGlobal.length, 'nodes');
};

// Debug function to test purge unused nodes functionality
window.testPurgeUnusedNodes = function() {
  // console.log('=== TESTING PURGE UNUSED NODES ===');
  
  if (!window.nodesGlobal || !window.links) {
    console.log('No data available for testing');
    return;
  }
  
  // Get all node IDs that are referenced in links
  const usedNodeIds = new Set();
  window.links.forEach(link => {
    const sourceId = link['source.id'] || link.source?.id || link.source;
    const targetId = link['target.id'] || link.target?.id || link.target;
    if (sourceId) usedNodeIds.add(sourceId);
    if (targetId) usedNodeIds.add(targetId);
  });
  
  // Find unused nodes
  const unusedNodes = window.nodesGlobal.filter(node => !usedNodeIds.has(node.id));
  
  // console.log('=== PURGE UNUSED NODES TEST RESULTS ===');
  // console.log('Total nodes:', window.nodesGlobal.length);
  // console.log('Total links:', window.links.length);
  // console.log('Used node IDs:', Array.from(usedNodeIds).sort());
  // console.log('Unused nodes found:', unusedNodes.length);
  
  if (unusedNodes.length > 0) {
    console.log('Unused nodes details:');
    unusedNodes.forEach((node, index) => {
      console.log(`  ${index + 1}. ID: "${node.id}", Title: "${node.title || node.name || 'N/A'}"`);
    });
  } else {
    console.log('✓ All nodes are connected to at least one flow');
  }
  
  return {
    totalNodes: window.nodesGlobal.length,
    totalLinks: window.links.length,
    usedNodes: window.nodesGlobal.length - unusedNodes.length,
    unusedNodes: unusedNodes.length,
    unusedNodesList: unusedNodes
  };
};

// Function to update global flow opacity setting
let globalFlowOpacityUpdateTimeout;
window.updateGlobalFlowOpacity = function updateGlobalFlowOpacity(newOpacity) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(globalFlowOpacityUpdateTimeout);
  
  globalFlowOpacityUpdateTimeout = setTimeout(() => {
    // Get the input element
    const globalFlowOpacityInput = document.getElementById('globalFlowOpacity');
    if (!globalFlowOpacityInput) return;

    // Validate and format input
    globalFlowOpacityInput.value = newOpacity;
    
    // console.log('Updating global flow opacity:', newOpacity);
    
    // Try to access the config
    let config = window.currentSankeyConfig;
    
    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        settings: settings
      };
    }
    
    if (config && config.settings && config.settings[0]) {
      // Update the setting
      config.settings[0].globalFlowOpacity = parseFloat(newOpacity);
      // console.log('Updated globalFlowOpacity in config:', config.settings[0].globalFlowOpacity);
      
      // Apply the opacity to existing flows
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
      if (sankeyDiagram) {
        const flows = sankeyDiagram.querySelectorAll('.links .link path');
        flows.forEach(flow => {
          flow.style.opacity = newOpacity;
        });
        // console.log(`Applied opacity ${newOpacity} to ${flows.length} flows`);
      }
      
      // Update global settings for export
      if (typeof window.settings !== 'undefined' && window.settings[0]) {
        window.settings[0].globalFlowOpacity = parseFloat(newOpacity);
      }
    } else {
      console.warn('Could not find config or settings to update globalFlowOpacity');
    }
  }, 100); // Short debounce for smooth slider interaction
};

// Function to update decimals round values setting
let decimalsRoundValuesUpdateTimeout;
window.updateDecimalsRoundValues = function updateDecimalsRoundValues(newDecimals) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(decimalsRoundValuesUpdateTimeout);
  
  decimalsRoundValuesUpdateTimeout = setTimeout(() => {
    // Get the input element
    const decimalsRoundValuesInput = document.getElementById('decimalsRoundValues');
    if (!decimalsRoundValuesInput) return;

    // Validate input
    const decimalsValue = parseInt(newDecimals);
    if (isNaN(decimalsValue) || decimalsValue < 0 || decimalsValue > 5) {
      console.warn('Invalid decimals value:', newDecimals, 'Must be between 0 and 5');
      return;
    }

    // Validate and format input
    decimalsRoundValuesInput.value = decimalsValue;
    
    // console.log('Updating decimals round values:', decimalsValue);
    
    // Update global variable for formatting
    window.decimalsRoundValues = decimalsValue;
    
    // Try to access the config
    let config = window.currentSankeyConfig;
    
    if (!config && typeof settings !== 'undefined' && settings[0]) {
      config = {
        sankeyInstanceID: 'energyflows',
        settings: settings
      };
    }
    
    if (config && config.settings && config.settings[0]) {
      // Update the setting
      config.settings[0].decimalsRoundValues = decimalsValue;
      // console.log('Updated decimalsRoundValues in config:', config.settings[0].decimalsRoundValues);
      
      // Update global settings for export
      if (typeof window.settings !== 'undefined' && window.settings[0]) {
        window.settings[0].decimalsRoundValues = decimalsValue;
      }
      
      // Update settingsGlobal used by D3 diagram
      if (typeof settingsGlobal !== 'undefined' && settingsGlobal[0]) {
        settingsGlobal[0].decimalsRoundValues = decimalsValue;
      }
      
      // Refresh the diagram to apply new rounding
      if (typeof refreshDiagram === 'function') {
        refreshDiagram();
      }
    } else {
      console.warn('Could not find config or settings to update decimalsRoundValues');
    }
  }, 300); // Debounce for 300ms
};

// Function to update transparent background setting
function updateTransparentBackground() {
  const transparentToggle = document.getElementById('transparentBackgroundToggle');
  const backgroundColorInput = document.getElementById('backgroundColor');
  
  if (!transparentToggle || !backgroundColorInput) {
    console.warn('Transparent background toggle or background color input not found');
    return;
  }
  
  const isTransparent = transparentToggle.checked;
  // console.log('Updating transparent background:', isTransparent);
  
  // Update settings
  if (window.settings && window.settings[0]) {
    window.settings[0].transparentBackground = isTransparent;
  }
  
  if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
    window.currentSankeyConfig.settings[0].transparentBackground = isTransparent;
  }
  
  // Grey out or enable background color input
  backgroundColorInput.disabled = isTransparent;
  backgroundColorInput.style.opacity = isTransparent ? '0.5' : '1';
  backgroundColorInput.style.cursor = isTransparent ? 'not-allowed' : 'pointer';
  
  // Update the actual background
  const svgElement = document.getElementById('energyflows_sankeySVGPARENT');
  if (svgElement) {
    if (isTransparent) {
      svgElement.style.backgroundColor = 'transparent';
    } else {
      // Use current background color value
      svgElement.style.backgroundColor = backgroundColorInput.value;
    }
  }
}

// Function to update unit setting
let unitUpdateTimeout;
function updateUnit(newUnit) {
  // Clear previous timeout to debounce rapid changes
  clearTimeout(unitUpdateTimeout);

  unitUpdateTimeout = setTimeout(() => {
    // console.log('Updating unit setting to:', newUnit);

    // Update the global settings
    if (window.settings && window.settings[0]) {
      window.settings[0].unit = newUnit;
    }

    // Update the current sankey config
    if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
      window.currentSankeyConfig.settings[0].unit = newUnit;
    }

    // Update the global currentUnit variable
    window.currentUnit = newUnit;
    
    // Also update the currentUnit in drawSankey.js scope if it exists
    if (typeof currentUnit !== 'undefined') {
      currentUnit = newUnit;
    }

    // console.log('Unit setting updated successfully');
    
    // Refresh the diagram to apply new unit to labels
    setTimeout(() => {
      if (typeof refreshDiagram === 'function') {
        // console.log('Refreshing diagram to apply new unit');
        refreshDiagram();
      } else {
        // Fallback: update existing labels directly
        updateDiagramLabelsWithNewUnit(newUnit);
      }
    }, 50); // Short delay to ensure currentUnit is updated
    
  }, 300); // Debounce with 300ms delay for text input
}

// Function to update diagram labels with new unit
function updateDiagramLabelsWithNewUnit(unit) {
  // console.log('Updating diagram labels with unit:', unit);
  
  const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT');
  if (!sankeyDiagram) {
    console.warn('Sankey diagram not found');
    return;
  }
  
  // Update node value labels (these show the unit after the value)
  const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node text');
  valueLabels.forEach(label => {
    const textContent = label.textContent;
    if (textContent && textContent.includes(' ')) {
      // Extract the value part (before the unit)
      const parts = textContent.split(' ');
      if (parts.length >= 2) {
        const formattedValue = parts[0]; // Keep the formatted value (with thousands separators)
        // Update with new unit
        label.textContent = `${formattedValue} ${unit}`;
      }
    }
  });
  
  // Update any tooltip or other label elements that might contain units
  const allTextElements = sankeyDiagram.querySelectorAll('text');
  allTextElements.forEach(textElement => {
    const content = textElement.textContent;
    if (content && (content.includes(' PJ') || content.includes(' TWh') || content.includes(' Unit undefined'))) {
      // Replace old units with new unit
      const newContent = content
        .replace(/ PJ/g, ` ${unit}`)
        .replace(/ TWh/g, ` ${unit}`)
        .replace(/ Unit undefined/g, ` ${unit}`);
      textElement.textContent = newContent;
    }
  });
  
  // console.log('Diagram labels updated with unit:', unit);
}

// Function to export diagram as SVG
function exportToSvg() {
  // console.log('=== EXPORTING TO SVG ===');
  
  const svgElement = document.getElementById('energyflows_sankeySVGPARENT');
  if (!svgElement) {
    alert('SVG element not found. Please ensure the diagram is loaded.');
    return;
  }
  
  try {
    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true);
    
    // Ensure viewBox is set
    if (!svgClone.getAttribute('viewBox')) {
      const width = svgClone.getAttribute('width') || '1250';
      const height = svgClone.getAttribute('height') || '900';
      const cleanWidth = parseFloat(width.replace('px', ''));
      const cleanHeight = parseFloat(height.replace('px', ''));
      
      // Get scale canvas setting for viewBox calculation
      let scaleCanvas = 1.0;
      if (window.currentSankeyConfig && window.currentSankeyConfig.settings && window.currentSankeyConfig.settings[0]) {
        scaleCanvas = window.currentSankeyConfig.settings[0].scaleCanvas || 1.0;
      }
      
      const viewBoxWidth = cleanWidth / scaleCanvas;
      const viewBoxHeight = cleanHeight / scaleCanvas;
      svgClone.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    }
    
    // Add XML namespace if not present
    if (!svgClone.getAttribute('xmlns')) {
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    // Replace Roboto font references with generic sans-serif for better compatibility
    const allTextElements = svgClone.querySelectorAll('text, tspan');
    let fontsReplaced = 0;
    
    allTextElements.forEach(textElement => {
      const currentFontFamily = textElement.getAttribute('font-family') || 
                               textElement.style.fontFamily || 
                               getComputedStyle(textElement).fontFamily;
      
      if (currentFontFamily && currentFontFamily.includes('Roboto')) {
        // Replace with generic sans-serif fallback
        const newFontFamily = 'Arial, Helvetica, sans-serif';
        if (textElement.hasAttribute('font-family')) {
          textElement.setAttribute('font-family', newFontFamily);
        }
        if (textElement.style.fontFamily) {
          textElement.style.fontFamily = newFontFamily;
        }
        fontsReplaced++;
      }
    });
    
    // console.log(`SVG Export: Replaced Roboto font in ${fontsReplaced} text elements`);
    
    // Also check for any style elements or CSS that might reference Roboto
    const styleElements = svgClone.querySelectorAll('style');
    let stylesReplaced = 0;
    
    styleElements.forEach(styleElement => {
      if (styleElement.textContent) {
        const originalContent = styleElement.textContent;
        let newContent = styleElement.textContent;
        
        // Remove Google Fonts import for Roboto
        newContent = newContent.replace(
          /@import\s+url\([^)]*fonts\.googleapis\.com[^)]*Roboto[^)]*\);?/gi,
          ''
        );
        
        // Replace font-family declarations that include Roboto
        newContent = newContent.replace(
          /font-family:\s*[^;]*Roboto[^;]*/gi,
          'font-family: Arial, Helvetica, sans-serif'
        );
        
        // Replace any remaining Roboto references in font stacks
        newContent = newContent.replace(
          /'Roboto'[^,;]*/gi,
          'Arial'
        );
        
        styleElement.textContent = newContent;
        
        if (originalContent !== newContent) {
          stylesReplaced++;
          // console.log('SVG Export: Style element before replacement:', originalContent.substring(0, 200) + '...');
          // console.log('SVG Export: Style element after replacement:', newContent.substring(0, 200) + '...');
        }
      }
    });
    
    // console.log(`SVG Export: Replaced Roboto font in ${stylesReplaced} style elements`);
    
    // Serialize the SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `sankeyfy_diagram_${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // console.log('SVG export completed successfully');
    
    // Show success feedback
    const originalText = document.getElementById('exportSvgButton').innerHTML;
    document.getElementById('exportSvgButton').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      Exported!
    `;
    
    setTimeout(() => {
      document.getElementById('exportSvgButton').innerHTML = originalText;
    }, 2000);
    
  } catch (error) {
    console.error('Error exporting SVG:', error);
    alert('Failed to export SVG. Please check the console for details.');
  }
}

// Function to verify what legend data will be exported
window.verifyLegendExportData = function verifyLegendExportData() {
  // console.log('=== LEGEND EXPORT VERIFICATION ===');
  
  const exportLegendData = window.legend;
  
  if (!exportLegendData || !Array.isArray(exportLegendData)) {
    // console.log('No legend data available for export');
    return { legendCount: 0, legendItems: [] };
  }
  
  // console.log('Legend items that WILL be included in Excel export:');
  exportLegendData.forEach((item, index) => {
    // console.log(`  ${index + 1}. ID: "${item.id}", Name: "${item.name}", Color: "${item.color}"`);
  });
  
  // console.log('Total legend items for export:', exportLegendData.length);
  
  // Also check which legend types are actually used by links
  const usedTypes = new Set();
  if (window.links) {
    window.links.forEach(link => {
      if (link.legend) usedTypes.add(link.legend);
    });
  }
  
  // console.log('Legend types currently used by links:', Array.from(usedTypes));
  
  // Check for any mismatches
  const exportedIds = new Set(exportLegendData.map(item => item.id));
  const unusedInExport = Array.from(exportedIds).filter(id => !usedTypes.has(id));
  const missingInExport = Array.from(usedTypes).filter(type => !exportedIds.has(type));
  
  if (unusedInExport.length > 0) {
    console.warn('Carrier items in export but not used by links:', unusedInExport);
  }
  
  if (missingInExport.length > 0) {
    console.error('Legend types used by links but missing from export:', missingInExport);
  }
  
  if (unusedInExport.length === 0 && missingInExport.length === 0) {
    // console.log('✅ Export legend data is perfectly synchronized with link usage');
  }
  
  return {
    legendCount: exportLegendData.length,
    legendItems: exportLegendData.map(item => item.id),
    usedTypes: Array.from(usedTypes),
    unusedInExport: unusedInExport,
    missingInExport: missingInExport,
    isClean: unusedInExport.length === 0 && missingInExport.length === 0
  };
};

// Function to verify export data includes recent changes
window.verifyExportData = function() {
  // console.log('=== EXPORT DATA VERIFICATION ===');
  
  const currentNodes = window.nodesGlobal || [];
  const currentLinks = window.links || [];
  
  // console.log('Current nodes count:', currentNodes.length);
  // console.log('Current links count:', currentLinks.length);
  
  // Look for recently added nodes (nodes with simple IDs like 'newNode', 'testNode', etc.)
  const recentNodes = currentNodes.filter(node => 
    node.id && (
      node.id.toLowerCase().includes('new') || 
      node.id.toLowerCase().includes('test') ||
      node.id === 'newNode' ||
      node.cluster === 0 // New nodes default to cluster 0
    )
  );
  
  // console.log('Recently added/modified nodes:', recentNodes.length);
  recentNodes.forEach((node, idx) => {
    // console.log(`  ${idx + 1}. ID: "${node.id}", Title: "${node.title}", Position: (${node.x}, ${node.y})`);
  });
  
  // Look for any links with unusual values that might be edits
  const originalLinksCount = window.originalLinksData ? window.originalLinksData.length : 0;
  const addedLinksCount = currentLinks.length - originalLinksCount;
  
  // console.log('Original links count:', originalLinksCount);
  // console.log('Added links count:', addedLinksCount);
  
  if (addedLinksCount > 0) {
    // console.log('Recently added links:');
    currentLinks.slice(-addedLinksCount).forEach((link, idx) => {
      // console.log(`  ${idx + 1}. ${link['source.id']} → ${link['target.id']}, Value: ${link.value}, Legend: ${link.legend}`);
    });
  }
  
  return {
    totalNodes: currentNodes.length,
    totalLinks: currentLinks.length,
    recentNodes: recentNodes.length,
    addedLinks: addedLinksCount
  };
};

// Test function to verify editing functions work
window.testEditingFunctions = function() {
  // console.log('=== TESTING EDITING FUNCTIONS ===');
  
  // Test if functions exist
  // console.log('editLink exists:', typeof window.editLink);
  // console.log('editNode exists:', typeof window.editNode);
  // console.log('openAddNodePopup exists:', typeof window.openAddNodePopup);
  // console.log('openAddFlowPopup exists:', typeof window.openAddFlowPopup);
  
  // Test opening add node popup
  if (typeof window.openAddNodePopup === 'function') {
    // console.log('Testing add node popup...');
    window.openAddNodePopup();
  }
};

// Simple test function for editing without refresh
window.testEditLinkSimple = function() {
  // console.log('=== TESTING SIMPLE EDIT LINK ===');
  
  // Create fake link data for testing
  const testLinkData = {
    source: 'test_source',
    target: 'test_target',
    value: 100,
    legend: 'test_legend',
    visibility: 1
  };
  
  // console.log('Calling editLink with test data...');
  if (typeof window.editLink === 'function') {
    window.editLink(testLinkData, null);
  } else {
    console.error('editLink function not found');
  }
};

// Test refresh function without editing
window.testRefreshDiagram = function() {
  // console.log('=== TESTING REFRESH DIAGRAM ===');
  refreshDiagram();
};

// Function to check and fix missing legend entries
window.checkAndFixLegendEntries = function() {
  // console.log('=== CHECKING LEGEND ENTRIES ===');
  
  const legendData = window.legend || window.carriers;
  if (!window.links || !legendData) {
    // console.log('No links or legend data available');
    return;
  }
  
  // Get all unique legend types used in links
  const usedLegendTypes = [...new Set(window.links.map(link => link.legend))];
  // console.log('Legend types used in links:', usedLegendTypes);
  
  // Get existing legend IDs
  const existingLegendIds = legendData.map(item => item.id);
  // console.log('Existing legend IDs:', existingLegendIds);
  
  // Find missing legend entries
  const missingLegendTypes = usedLegendTypes.filter(type => 
    type && !existingLegendIds.includes(type)
  );
  
  if (missingLegendTypes.length > 0) {
    // console.log('Missing legend entries:', missingLegendTypes);
    
    // Add missing legend entries with default colors
    const defaultColors = ['#999', '#666', '#333', '#CCC', '#777'];
    let colorIndex = 0;
    
    missingLegendTypes.forEach(missingType => {
      const newLegendEntry = {
        id: missingType,
        color: defaultColors[colorIndex % defaultColors.length],
        title: missingType.replace(/_/g, ' ').toUpperCase()
      };
      
      window.legend.push(newLegendEntry);
      // console.log('Added missing legend entry:', newLegendEntry);
      colorIndex++;
    });
    
    // console.log(`Added ${missingLegendTypes.length} missing legend entries`);
    
    // Regenerate legend color controls if the function exists
    if (typeof generateLegendColorControls === 'function') {
      generateLegendColorControls();
    }
  } else {
    // console.log('No missing legend entries found');
  }
};

// Simple test function for editing node without refresh
window.testEditNodeSimple = function() {
  // console.log('=== TESTING SIMPLE EDIT NODE ===');
  
  // Create fake node data for testing
  const testNodeData = {
    id: 'test_node',
    title: 'Test Node',
    x: 100,
    y: 200,
    value: 50
  };
  
  // console.log('Calling editNode with test data...');
  if (typeof window.editNode === 'function') {
    window.editNode(testNodeData, null);
  } else {
    console.error('editNode function not found');
  }
};

// Note: Event listeners are now integrated directly into drawSankey.js
// Links: Click to edit
// Nodes: Shift+click to edit

// Collapsible Control Panel Functions
function toggleSection(headerElement) {
  const targetId = headerElement.getAttribute('data-target');
  const content = document.getElementById(targetId);
  
  if (!content) return;
  
  const isCollapsed = headerElement.classList.contains('collapsed');
  
  if (isCollapsed) {
    // Expand
    headerElement.classList.remove('collapsed');
    content.classList.remove('collapsed');
  } else {
    // Collapse
    headerElement.classList.add('collapsed');
    content.classList.add('collapsed');
  }
}

// Drag and Drop functionality for Excel, YAML, and JSON files
function setupDragAndDrop() {
  // console.log('Setting up drag and drop functionality for Excel, YAML, and JSON files...');
  
  // Check if handleExcelImport is available
  if (typeof window.handleExcelImport === 'function') {
    // console.log('handleExcelImport function is available');
  } else {
    console.error('handleExcelImport function is NOT available');
  }
  
  // Single event handler approach to avoid conflicts
  document.addEventListener('dragenter', function(e) {
    // console.log('Drag enter event');
    e.preventDefault();
    document.body.classList.add('drag-over');
  }, false);
  
  document.addEventListener('dragover', function(e) {
    // console.log('Drag over event');
    e.preventDefault();
    document.body.classList.add('drag-over');
  }, false);
  
  document.addEventListener('dragleave', function(e) {
    // console.log('Drag leave event');
    e.preventDefault();
    // Only remove highlight if we're leaving the document entirely
    if (e.relatedTarget === null || !document.contains(e.relatedTarget)) {
      document.body.classList.remove('drag-over');
    }
  }, false);
  
  document.addEventListener('drop', function(e) {
    // console.log('=== DROP EVENT ON DOCUMENT ===');
    e.preventDefault();
    document.body.classList.remove('drag-over');
    
    // Call our drop handler
    handleDrop(e);
  }, false);
  
  function handleDrop(e) {
    // console.log('=== HANDLE DROP FUNCTION CALLED ===');
    // console.log('Drop event:', e);
    // console.log('DataTransfer:', e.dataTransfer);
    
    const dt = e.dataTransfer;
    if (!dt) {
      console.error('No dataTransfer object found');
      return;
    }
    
    const files = dt.files;
    // console.log('Files from dataTransfer:', files);
    // console.log('Number of files:', files.length);
    
    if (files.length === 0) {
      // console.log('No files dropped');
      return;
    }
    
    const file = files[0]; // Take the first file
    // console.log('Dropped file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Validate file type and determine handler
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isYAML = fileName.endsWith('.yaml') || fileName.endsWith('.yml');
    const isJSON = fileName.endsWith('.json');
    
    if (!isExcel && !isYAML && !isJSON) {
      alert('Please drop a valid file (.xlsx, .xls, .yaml, .yml, or .json)');
      return;
    }
    
    // Handle based on file type
    if (isExcel) {
      // Handle Excel file
      const fakeEvent = {
        target: {
          files: [file]
        }
      };
      
      // console.log('Processing dropped Excel file...');
      
      if (typeof window.handleExcelImport === 'function') {
        try {
          window.handleExcelImport(fakeEvent, true); // Pass true for isDragDrop
          // console.log('Excel file imported successfully via drag-and-drop');
        } catch (error) {
          console.error('Error calling handleExcelImport:', error);
          alert('Error processing the dropped Excel file: ' + error.message);
        }
      } else {
        console.error('handleExcelImport function is not available');
        alert('Excel import functionality is not available');
      }
    } else if (isYAML) {
      // Handle YAML file
      // console.log('Processing dropped YAML file...');
      handleYAMLDrop(file);
    } else if (isJSON) {
      // Handle JSON file
      // console.log('Processing dropped JSON file...');
      handleJSONDrop(file);
    }
  }
  
  // Handler for dropped YAML files
  function handleYAMLDrop(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // console.log('YAML file read successfully, parsing...');
        
        // Parse YAML
        const data = jsyaml.load(event.target.result);
        // console.log('YAML data parsed successfully:', data);
        
        if (!data.nodes || !data.links || !data.carriers) {
          throw new Error('Invalid YAML file: missing required data (nodes, links, or carriers)');
        }
        
        // Call the same processing logic as importYAMLFile
        processImportedData(data, 'YAML');
        
      } catch (error) {
        console.error('Error importing YAML file:', error);
        alert('Failed to import YAML file: ' + error.message);
      }
    };
    
    reader.onerror = function(error) {
      console.error('Error reading YAML file:', error);
      alert('Failed to read YAML file');
    };
    
    reader.readAsText(file);
  }
  
  // Handler for dropped JSON files
  function handleJSONDrop(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // console.log('JSON file read successfully, parsing...');
        
        // Parse JSON
        const data = JSON.parse(event.target.result);
        // console.log('JSON data parsed successfully:', data);
        
        if (!data.nodes || !data.links || !data.carriers) {
          throw new Error('Invalid JSON file: missing required data (nodes, links, or carriers)');
        }
        
        // Call the same processing logic as importJSONFile
        processImportedData(data, 'JSON');
        
      } catch (error) {
        // console.error('Error importing JSON file:', error);
        alert('Failed to import JSON file: ' + error.message);
      }
    };
    
    reader.onerror = function(error) {
      // console.error('Error reading JSON file:', error);
      alert('Failed to read JSON file');
    };
    
    reader.readAsText(file);
  }
  
  // Shared function to process imported data (used by both YAML and JSON drag-drop)
  function processImportedData(data, format) {
    // Transform settings if needed
    let transformedSettings;
    // console.log(`Settings format in ${format}:`, data.settings);
    
    if (Array.isArray(data.settings) && data.settings.length > 0 && data.settings[0].setting) {
      // Settings are in [{setting: key, waarde: value}] format, need to transform
      // console.log('Detected array format settings, transforming...');
      transformedSettings = transformData(data.settings);
      // console.log('Transformed settings from array format:', transformedSettings);
    } else if (Array.isArray(data.settings) && data.settings.length > 0) {
      // Settings are already in [{key: value}] format
      transformedSettings = data.settings;
    } else {
      // No settings or invalid format
      transformedSettings = [{}];
    }
    
    // Store in global variables
    window.nodesGlobal = data.nodes;
    window.links = data.links;
    window.carriers = data.carriers;
    window.legend = data.carriers; // Keep both for compatibility
    window.settings = transformedSettings;
    window.remarks = data.remarks || [];
    
    // Update settingsGlobal used by D3 diagram
    if (typeof settingsGlobal !== 'undefined') {
      settingsGlobal = transformedSettings;
    }
    
    // Store original data
    window.originalExcelData = {
      nodes: JSON.parse(JSON.stringify(data.nodes)),
      links: JSON.parse(JSON.stringify(data.links)),
      carriers: JSON.parse(JSON.stringify(data.carriers)),
      settings: JSON.parse(JSON.stringify(transformedSettings)),
      remarks: JSON.parse(JSON.stringify(data.remarks || []))
    };
    
    // Store original links separately for reset functionality
    window.originalLinksData = JSON.parse(JSON.stringify(data.links));
    
    // Create config object
    window.currentSankeyConfig = {
      sankeyInstanceID: 'energyflows',
      targetDIV: 'SVGContainer_energyflows',
      settings: transformedSettings,
      carriers: data.carriers,
      legend: data.carriers,
      remarks: data.remarks || []
    };
    
    // console.log('Data loaded successfully. Processing...');
    
    // Clear existing SVG content
    const existingSVG = document.getElementById('energyflows_sankeySVGPARENT');
    if (existingSVG) {
      existingSVG.remove();
    }
    
    // Clear the container
    const container = document.getElementById('SVGContainer_energyflows');
    if (container) {
      container.innerHTML = '';
    }
    
    // Reset sankey instances to avoid conflicts with old state
    if (typeof sankeyInstances !== 'undefined') {
      Object.keys(sankeyInstances).forEach(key => delete sankeyInstances[key]);
    }
    if (typeof window.sankeyInstances !== 'undefined') {
      Object.keys(window.sankeyInstances).forEach(key => delete window.sankeyInstances[key]);
    }
    if (typeof sankeyDataObject !== 'undefined') {
      sankeyDataObject = {links: [], nodes: []};
    }
    if (typeof window.sankeyDataObject !== 'undefined') {
      window.sankeyDataObject = {links: [], nodes: []};
    }
    
    // Set flag to disable transitions during import
    window.isImporting = true;
    
    // Call processData to render the diagram
    // console.log('Calling processData...');
    if (window.processData || typeof processData !== 'undefined') {
      const processFn = window.processData || processData;
      processFn(data.links, data.nodes, data.carriers, transformedSettings, data.remarks || [], window.currentSankeyConfig);
      // console.log('processData completed without errors');
      
      // Update control panel and legend
      setTimeout(() => {
        // console.log('Updating control panel with settings:', transformedSettings[0]);
        updateControlPanelFromSettings(transformedSettings[0]);
        // console.log('Generating legend color controls...');
        generateLegendColorControls();
        
        // Check node balance after import
        if (typeof window.checkNodeBalance === 'function') {
          window.checkNodeBalance();
        }
        // console.log('Control panel update complete');
      }, 500);
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // console.log(`${format} import via drag-and-drop completed successfully`);
      // alert(`${format} file imported successfully!`);
    } else {
      console.error('processData function not available');
      throw new Error('processData function not available. Make sure drawSankey.js is loaded.');
    }
  }
}

// Initialize drag and drop when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure all functions are loaded
  setTimeout(() => {
    setupDragAndDrop();
    window.dragDropInitialized = true;
    
    // Initialize export format from localStorage
    initializeExportFormat();
  }, 100);
});

// Also set up drag and drop on window load as a fallback
window.addEventListener('load', function() {
  // Only set up if not already done
  if (!window.dragDropInitialized) {
    setupDragAndDrop();
    window.dragDropInitialized = true;
  }
});

// Debug function to test drag-and-drop setup
window.testDragDropSetup = function() {
  // console.log('=== DRAG DROP SETUP TEST ===');
  // console.log('dragDropInitialized:', window.dragDropInitialized);
  // console.log('handleExcelImport available:', typeof window.handleExcelImport === 'function');
  // console.log('body has drag-over class:', document.body.classList.contains('drag-over'));
  
  // Test adding/removing drag-over class
  // console.log('Testing drag-over class...');
  document.body.classList.add('drag-over');
  setTimeout(() => {
    document.body.classList.remove('drag-over');
    // console.log('Drag-over class test complete');
  }, 2000);
  
  // console.log('Setup test complete. Try dragging an Excel file now.');
};


