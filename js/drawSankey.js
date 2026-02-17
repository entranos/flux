let sankeyInstances = {}
let sankeyDataObject = {}
// Make sankeyInstances globally accessible
window.sankeyInstances = sankeyInstances
// let sankeyLayout
// let sankeyDiagram
let activeScenario = 0
let scaleHeight = 1
let nodesGlobal
let globalscaleHeight
let globalCO2flowScale
let currentK = 1
let globalActiveScenario = {}
let globalActiveYear = {}
let globalActiveWACC = {}
let globalActiveEnergyflowsSankey = {}
let globalActiveEnergyflowsFilter
let links = {}
let nodes = {}
let legend = {}
let settings = {}
let remarks = {}
let globalSankeyInstancesActiveDataset = {}
let OriginalSankeyDataObject
// Initialize currentUnit without a default value
let currentUnit = ''
// Make currentUnit globally accessible
window.currentUnit = currentUnit

let currentScenarioID = 0

// Variables moved from drawSelectionButtons.js
let globalActiveToepassing = 'alle'
let globalActiveSector = 'alle'

selectionButtonsHaveInitialized = false

// function process_xlsx_edit (config, rawSankeyData) {
//   if (dataSource == 'url') {
//   }
//   else if (dataSource == 'file') {
//   }
// }

function processData (links, nodes, legend, settings, remarks, config) {
  // console.log('Links:', links)
  // console.log('Nodes:', nodes)
  // console.log('Legend:', legend)
  // console.log('Settings:', settings)
  // console.log('Remarks:', remarks)

  nodesGlobal = nodes

  config.settings = settings
  config.carriers = legend // legend variable contains carriers data

  // Initialize currentUnit from settings
  if (settings && settings[0] && settings[0].unit !== undefined && settings[0].unit !== null) {
    currentUnit = settings[0].unit
    window.currentUnit = settings[0].unit
  }

  // Store original unscaled links data for scale adjustments
  if (!window.originalLinksData) {
    // Deep clone the original links data before any scaling
    window.originalLinksData = JSON.parse(JSON.stringify(links))
  }

  // Store config and data globally for access from title update function
  if (typeof window !== 'undefined') {
    window.currentSankeyConfig = config
    window.nodesGlobal = nodesGlobal
    window.links = links
    window.carriers = legend // legend variable contains carriers data
    window.settings = settings
    window.remarks = remarks
    window.processData = processData
    window.drawSankey = drawSankey
    window.reSankey = reSankey
    window.tick = tick
    window.selectionButtonsHaveInitialized = selectionButtonsHaveInitialized

    // Store original data for full Excel export (if not already stored)
    if (!window.originalExcelData) {
      window.originalExcelData = {
        links: JSON.parse(JSON.stringify(links)),
        nodes: JSON.parse(JSON.stringify(nodes)),
        legend: JSON.parse(JSON.stringify(legend)),
        settings: JSON.parse(JSON.stringify(settings)),
        remarks: JSON.parse(JSON.stringify(remarks))
      }
    }

    // Store current processed links data for canvas size changes
    window.currentProcessedLinksData = JSON.parse(JSON.stringify(links))

    // Store reference to complete original workbook if available
    if (typeof sankeyDataObject !== 'undefined' && sankeyDataObject.originalWorkbook) {
      window.originalWorkbook = sankeyDataObject.originalWorkbook
    }
  }

  globalscaleHeight = settings[0].scaleHeight
  globalCO2flowScale = settings[0].scaleDataValueCO2flow

  sankeyDataObject = {links: [],nodes: [],order: []}

  let scaleValues = settings[0].scaleDataValue
  let scaleValues_co2flow = settings[0].scaleDataValueCO2flow
  for (i = 0;i < links.length;i++) {
    let co2flow = false
    if (links[i].carrier == 'co2flow') {co2flow = true}
    Object.keys(links[i]).forEach(key => {
      if (typeof links[i][key] == 'number') {
        if (co2flow) {
          links[i][key] = links[i][key] / scaleValues_co2flow
        }else {
          // Inverted scaling: multiply instead of divide so larger values make flows thicker
          links[i][key] = links[i][key] * scaleValues
        }
      }
    })
  }

  let maxColumn = 0

  // Generate order object
  nodes.forEach((element) => {
    if (element.column > maxColumn) {
      maxColumn = element.column
    }
  })

  const columnLength = maxColumn + 1
  for (let i = 0; i < columnLength; i++) {
    sankeyDataObject.order.push([[]])
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < sankeyDataObject.order.length; j++) {
      if (nodes[i].column === j) {
        if (sankeyDataObject.order[j].length === 0) {
          sankeyDataObject.order[j].push([])
        }
        for (let k = 0; k < nodes[i].cluster; k++) {
          if (!sankeyDataObject.order[j].includes(k)) {
            sankeyDataObject.order[j].push([])
          }
        }
        if (
          sankeyDataObject.order[j][nodes[i].cluster].length === 0
        ) {
          sankeyDataObject.order[j][nodes[i].cluster].push([])
        }
        for (let k = 0; k < nodes[i].row; k++) {
          if (!sankeyDataObject.order[j][nodes[i].cluster].includes(k)) {
            sankeyDataObject.order[j][nodes[i].cluster].push([])
          }
        }
        sankeyDataObject.order[j][nodes[i].cluster][nodes[i].row].push(
          nodes[i].id
        )
      }
    }
  }

  // Generate nodes object
  // console.log(remarks)
  for (let i = 0; i < nodes.length; i++) {
    sankeyDataObject.nodes.push({
      // remark: remarks[i],
      title: nodes[i]['title'],
      // 'title': nodes[i]['title'],
      // 'title.electricity': nodes[i]['title.electricity'],
      // 'title.hydrogen': nodes[i]['title.hydrogen'],
      // 'title.heat': nodes[i]['title.heat'],
      // 'title.carbon': nodes[i]['title.carbon'],
      id: nodes[i].id,
      direction: nodes[i].direction,
      index: i,
      dummy: nodes[i].dummy,
      x: nodes[i]['x'],
      y: nodes[i]['y'],
      // 'x': nodes[i]['x.system'],
      // 'y': nodes[i]['y.system'],
      // 'x.electricity': nodes[i]['x.electricity'],
      // 'y.electricity': nodes[i]['y.electricity'],
      // 'x.hydrogen': nodes[i]['x.hydrogen'],
      // 'y.hydrogen': nodes[i]['y.hydrogen'],
      // 'x.heat': nodes[i]['x.heat'],
      // 'y.heat': nodes[i]['y.heat'],
      // 'x.carbon': nodes[i]['x.carbon'],
      // 'y.carbon': nodes[i]['y.carbon'],
      'labelposition': nodes[i]['labelposition'],
    // 'labelposition.electricity': nodes[i]['labelposition.electricity'],
    // 'labelposition.hydrogen': nodes[i]['labelposition.hydrogen'],
    // 'labelposition.heat': nodes[i]['labelposition.heat'],
    // 'labelposition.carbon': nodes[i]['labelposition.carbon']
    })
  }

  // Generate scenario object
  // no scenarios in flux - removed support for multiple scenarios
  const scenarios = [{'title': '','id': 'value'}]

  // const scenarios = []
  // let counter = 0
  // for (let s = 0; s < Object.keys(links[0]).length; s++) {
  //   if (Object.keys(links[0])[s].includes('scenario')) {
  //     if (counter < 10) {
  //       scenarios.push({
  //         title: Object.keys(links[0])[s].slice(10),
  //         id: Object.keys(links[0])[s]
  //       })
  //     } else {
  //       scenarios.push({
  //         title: Object.keys(links[0])[s].slice(11),
  //         id: Object.keys(links[0])[s]
  //       })
  //     }
  //     counter++
  //   }
  // }

  config.scenarios = scenarios

  // Generate links object
  for (let i = 0; i < links.length; i++) {
    sankeyDataObject.links.push({
      // remark: remarks[i],
      index: i,
      source: links[i]['source.id'],
      target: links[i]['target.id'],
      color: getColor(links[i]['carrier'], legend),
      value: links[i].value,
      type: links[i].type || ('auto_' + Math.random().toString(36).substring(2, 10)),
      carrier: links[i]['carrier'],
      visibility: 1,
      annotate: links[i].annotate || '' // Add annotate attribute from YAML
    })
    scenarios.forEach((element) => {
      sankeyDataObject.links[i][element.id] = links[i][element.id]
    })
  }

  adaptTotalHeight = config.settings[0].adaptTotalHeight

  // console.log(config.targetDIV)
  const width = document.getElementById(config.targetDIV).offsetWidth
  const height = document.getElementById(config.targetDIV).offsetHeight

  if (!(config.sankeyInstanceID in sankeyInstances)) {
    sankeyInstances[config.sankeyInstanceID] = {}

    sankeyInstances[config.sankeyInstanceID].sankeyLayout = d3.sankey().extent([
      [settings[0].horizontalMargin, settings[0].verticalMargin],
      [width - settings[0].horizontalMargin, height - settings[0].verticalMargin]
    ])

    sankeyInstances[config.sankeyInstanceID].sankeyDiagram = d3
      .sankeyDiagram()
      .nodeTitle((d) => {
        if (d.title && d.title.startsWith('.')) {
          return null // Do not draw a title if it starts with '.'
        }
        if (d.title && d.title.startsWith('_')) {
          return null // Do not draw a title if it starts with '_' (but value will still be shown)
        }
        // For '_' nodes, return the title so the element is created (content will be replaced with value)
        return d.title
      })
      .linkColor((d) => d.color)
  }

  // Make sankeyDataObject globally available for tick() function
  window.sankeyDataObject = sankeyDataObject
  // console.log('Set window.sankeyDataObject with', sankeyDataObject.links.length, 'links and', sankeyDataObject.nodes.length, 'nodes')

  drawSankey(sankeyDataObject, config)

  // Apply initial nodeWidth setting from Excel data
  setTimeout(() => {
    if (config.settings && config.settings[0] && config.settings[0].nodeWidth) {
      const nodeWidth = config.settings[0].nodeWidth
      // console.log('Applying initial nodeWidth from Excel:', nodeWidth)

      // Apply the node width to the rendered diagram
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT')
      if (sankeyDiagram) {
        const nodeRects = sankeyDiagram.querySelectorAll('.nodes .node .node-click-target')
        nodeRects.forEach(rect => {
          rect.setAttribute('width', nodeWidth)
        })
      // console.log(`Applied nodeWidth ${nodeWidth} to ${nodeRects.length} nodes`)
      }
    }
  }, 500) // Apply after diagram is rendered but before balance check

  // Apply initial label fill color setting
  setTimeout(() => {
    if (config.settings && config.settings[0] && config.settings[0].labelFillColor) {
      const labelFillColor = config.settings[0].labelFillColor
      // console.log('Applying initial labelFillColor from Excel:', labelFillColor)

      // Apply the label fill color to the rendered diagram
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT')
      if (sankeyDiagram) {
        const titleBackdrops = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-title')
        const valueBackdrops = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value')

        titleBackdrops.forEach(backdrop => {
          backdrop.style.fill = labelFillColor
        })
        valueBackdrops.forEach(backdrop => {
          backdrop.style.fill = labelFillColor
        })
      // console.log(`Applied labelFillColor ${labelFillColor} to ${titleBackdrops.length + valueBackdrops.length} backdrops`)
      }
    }
  }, 500) // Apply after diagram is rendered

  // Apply initial show value labels setting
  setTimeout(() => {
    if (config.settings && config.settings[0]) {
      const showValueLabelsSetting = config.settings[0].showValueLabels || 'Yes'
      // console.log('Applying initial showValueLabels from Excel:', showValueLabelsSetting)

      // Apply the show value labels setting to the rendered diagram
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT')
      if (sankeyDiagram) {
        const valueLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-value')
        const valueLabelsBackdrop = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-value')
        const titleLabels = sankeyDiagram.querySelectorAll('.nodes .node .node-title')
        const titleBackdrops = sankeyDiagram.querySelectorAll('.nodes .node .node-backdrop-title')
        let processedCount = 0

        valueLabels.forEach(label => {
          // Find the parent node element to get the node data
          const nodeElement = label.closest('.node')
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || ''
            // Never show labels for nodes starting with '.'
            if (nodeName.startsWith('.')) {
              label.style.display = 'none'
            } else if (nodeName.startsWith('_')) {
              // For nodes starting with '_', hide the value label (we'll show it in title position)
              label.style.display = 'none'
            } else {
              // For nodes starting with '_', show the value label (title is hidden)
              // For all other nodes, respect the setting
              label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none'
              processedCount++
            }
          } else {
            // Fallback: if no data available, respect the setting
            label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none'
            processedCount++
          }
        })

        // Also hide/show value label backdrops
        valueLabelsBackdrop.forEach(label => {
          const nodeElement = label.closest('.node')
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || ''
            if (nodeName.startsWith('.')) {
              label.style.display = 'none'
            } else if (nodeName.startsWith('_')) {
              // For nodes starting with '_', hide the value backdrop
              label.style.display = 'none'
            } else {
              // For nodes starting with '_', value backdrops are hidden (value shown in title position)
              // For all other nodes, respect the setting
              label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none'
            }
          } else {
            label.style.display = showValueLabelsSetting === 'Yes' ? 'block' : 'none'
          }
        })

        // For nodes starting with '_', show the value in the title position
        titleLabels.forEach(label => {
          const nodeElement = label.closest('.node')
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || ''
            if (nodeName.startsWith('_')) {
              // Get the value from the corresponding value label
              const valueLabel = nodeElement.querySelector('.node-value')
              if (valueLabel) {
                // Copy the value text to the title label
                label.textContent = valueLabel.textContent
                label.style.display = 'block'
              }
            }
          }
        })

        // Show title backdrop for nodes starting with '_'
        titleBackdrops.forEach(backdrop => {
          const nodeElement = backdrop.closest('.node')
          if (nodeElement && nodeElement.__data__) {
            const nodeName = nodeElement.__data__.title || ''
            if (nodeName.startsWith('_')) {
              backdrop.style.display = 'block'
            }
          }
        })

        // Note: For nodes starting with '_', the value is shown in the title position
        // This is handled directly in d3-sankey-diagram.js, not here

      // console.log(`Applied showValueLabels ${showValueLabelsSetting} to ${processedCount} labels`)
      }
    }
  }, 500) // Apply after diagram is rendered

  // Apply initial flow opacity setting
  setTimeout(() => {
    if (config.settings && config.settings[0] && config.settings[0].globalFlowOpacity !== undefined) {
      const flowOpacity = config.settings[0].globalFlowOpacity
      // console.log('Applying initial globalFlowOpacity from Excel:', flowOpacity)

      // Apply the flow opacity to the rendered diagram
      const sankeyDiagram = document.querySelector('#energyflows_sankeySVGPARENT')
      if (sankeyDiagram) {
        const flows = sankeyDiagram.querySelectorAll('.links .link path')
        flows.forEach(flow => {
          flow.style.opacity = flowOpacity
        })
      // console.log(`Applied flowOpacity ${flowOpacity} to ${flows.length} flows`)
      }
    }
  }, 500) // Apply after diagram is rendered

  // Check node balance after initial diagram rendering
  setTimeout(() => {
    if (typeof window.checkNodeBalance === 'function') {
      // console.log('Running node balance check after initial load...')
      window.checkNodeBalance()
    }
  }, 1000) // Give the diagram time to fully render

  // Trigger the actual diagram rendering by calling tick
  // console.log('processData complete - calling tick to render diagram')
  tick(config)
}

function getColor (id, carriers) {
  // Skip if carrier is undefined
  if (!id) {
    return 'black'
  }

  for (let i = 0; i < carriers.length; i++) {
    if (carriers[i].id === id) {
      return carriers[i].color
    }
  }
  console.warn('WARNING: DID NOT FIND MATCHING CARRIER ENTRY - "' + id + '"')
  return 'black'
}

function drawSankey (sankeyDataInput, config) {
  // console.log('=== DRAW SANKEY CALLED ===')
  // console.log('drawSankey called with:', sankeyDataInput.links.length, 'links and', sankeyDataInput.nodes.length, 'nodes')
  // console.log('Config:', {
  //   sankeyInstanceID: config.sankeyInstanceID,
  //   targetDIV: config.targetDIV,
  //   settings: !!config.settings,
  //   legend: !!config.legend
  // })
  // console.log('sankeyInstances available:', !!sankeyInstances[config.sankeyInstanceID])
  // console.log('sankeyDataInput sample:', {
  //   firstLink: sankeyDataInput.links[0],
  //   firstNode: sankeyDataInput.nodes[0]
  // })
  sankeyData = sankeyDataInput
  d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT').remove()

  assetslog = {}

  let canvasWidth = config.settings[0].canvasWidth
  let canvasHeight = config.settings[0].canvasHeight
  let scaleCanvas = config.settings[0].scaleCanvas || 1.0

  // console.log(config.settings[0].backgroundColor)
  // console.log('Creating SVG with dimensions:', canvasWidth, 'x', canvasHeight)
  // console.log('Canvas scale setting:', scaleCanvas)

  // Check if transparent background is enabled
  const isTransparent = config.settings[0].transparentBackground === true ||
    config.settings[0].transparentBackground === 'true' ||
    config.settings[0].transparentBackground === 'Yes' ||
    config.settings[0].transparentBackground === 1 ||
    config.settings[0].transparentBackground === '1'

  // console.log('Transparent background setting:', config.settings[0].transparentBackground, '-> isTransparent:', isTransparent)

  // Calculate viewBox dimensions based on scale (inverse of scale for zoom effect)
  const viewBoxWidth = canvasWidth / scaleCanvas
  const viewBoxHeight = canvasHeight / scaleCanvas
  const viewBoxString = `0 0 ${viewBoxWidth} ${viewBoxHeight}`

  // console.log('ViewBox with scaling applied:', viewBoxString)

  d3.select('#' + config.targetDIV)
    .append('svg')
    .style('position', 'relative')
    .attr('id', config.sankeyInstanceID + '_sankeySVGPARENT')
    .attr('width', canvasWidth + 'px')
    .attr('height', canvasHeight + 'px')
    .attr('viewBox', viewBoxString)
    .style('background-color', isTransparent ? 'transparent' : config.settings[0].backgroundColor)
    // .style('pointer-events', 'auto')
    .append('g')

  // console.log('SVG created successfully')

  // backdropCanvas = d3.select('#sankeySVGbackdrop')
  sankeyInstances[config.sankeyInstanceID].sankeyCanvas = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
  // buttonsCanvas = d3.select('#' + config.targetDIV + '_buttonsSVG').append('g')
  sankeyInstances[config.sankeyInstanceID].parentCanvas = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT').append('g')

  sankeyCanvas = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')

  sankeyCanvas.append('text')
    .attr('id', 'diagramTitle')
    .attr('class', 'diagram-title')
    .attr('x', config.settings[0].titlePositionX || 50)
    .attr('y', config.settings[0].titlePositionY || 40)
    .style('font-size', (config.settings[0].titleFontSize || 24) + 'px')
    .style('fill', config.settings[0].titleColor || '#000000')
    .text(config.settings[0].title)

  // sankeyCanvas.append('rect').attr('id', 'delineator_rect_bronnen').attr('width', 300).attr('height', 2).attr('x', 15).attr('y', 70).attr('fill', '#888').attr('rx', 2.5).attr('ry', 2.5)
    // sankeyCanvas.append('rect').attr('id', 'delineator_rect_conversie').attr('width', 606).attr('height', 2).attr('x', 350).attr('y', 70).attr('fill', '#888').attr('rx', 2.5).attr('ry', 2.5)
    // sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal').attr('width', 590).attr('height', 2).attr('x', 990).attr('y', 70).attr('fill', '#888').attr('rx', 2.5).attr('ry', 2.5)
    // sankeyCanvas.append('rect').attr('id', 'delineator_rect_keteninvoer').attr('width', 230).attr('height', 2).attr('x', 340).attr('y', 70).attr('fill', '#888').attr('rx', 2.5).attr('ry', 2.5).style('opacity', 0)
    // sankeyCanvas.append('rect').attr('id', 'delineator_rect_ketenuitvoer').attr('width', 250).attr('height', 2).attr('x', 970).attr('y', 70).attr('fill', '#888').attr('rx', 2.5).attr('ry', 2.5).style('opacity', 0)

  // sankeyCanvas.append('text').attr('id', 'delineator_text_bronnen').attr('x', 20).attr('y', 53).attr('fill', '#666').style('font-weight', 400).style('font-size', '20px').text('BRONNEN')
    // sankeyCanvas.append('text').attr('id', 'delineator_text_conversie').attr('x', 355).attr('y', 53).attr('fill', '#666').style('font-weight', 400).style('font-size', '20px').text('CONVERSIE')
    // sankeyCanvas.append('text').attr('id', 'delineator_text_finaal').attr('x', 995).attr('y', 53).attr('fill', '#666').style('font-weight', 400).style('font-size', '20px').text('FINAAL VERBRUIK')
    // sankeyCanvas.append('text').attr('id', 'delineator_text_keteninvoer').attr('x', 345).attr('y', 53).attr('fill', '#666').style('font-weight', 400).style('font-size', '20px').text('INVOER UIT KETEN').style('opacity', 0)
    // sankeyCanvas.append('text').attr('id', 'delineator_text_ketenuitvoer').attr('x', 975).attr('y', 53).attr('fill', '#666').style('font-weight', 400).style('font-size', '20px').text('UITVOER NAAR KETEN').style('opacity', 0)

  // UIT / NAAR KETEN DILINEATORS
  sankeyCanvas.append('rect').attr('id', 'delineator_rect_koolstofketen_uit').attr('width', 230).attr('height', 250).attr('x', 290).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_koolstofketen_uit').attr('x', 315).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('KOOLSTOFKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_waterstofketen_uit').attr('width', 230).attr('height', 190).attr('x', 290).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_waterstofketen_uit').attr('x', 315).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('WATERSTOFKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_elektriciteitsketen_uit').attr('width', 230).attr('height', 190).attr('x', 290).attr('y', 330).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_elektriciteitsketen_uit').attr('x', 315).attr('y', 368).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('ELEKTRICITEITSKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_warmteketen_in').attr('width', 230).attr('height', 140).attr('x', 970).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_warmteketen_in').attr('x', 995).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('WARMTEKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_waterstofketen_in').attr('width', 230).attr('height', 120).attr('x', 970).attr('y', 275).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_waterstofketen_in').attr('x', 995).attr('y', 313).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('WATERSTOFKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_elektriciteitsketen_in').attr('width', 230).attr('height', 140).attr('x', 970).attr('y', 95).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_elektriciteitsketen_in').attr('x', 995).attr('y', 133).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('ELEKTRICITEITSKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_koolstofketen_in').attr('width', 230).attr('height', 140).attr('x', 970).attr('y', 600).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_koolstofketen_in').attr('x', 995).attr('y', 638).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('KOOLSTOFKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal_go').attr('width', 230).attr('height', 140).attr('x', 1350).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_finaal_go').attr('x', 1375).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('GEBOUWDE OMGEVING').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal_mobiliteit').attr('width', 230).attr('height', 140).attr('x', 1350).attr('y', 680).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_finaal_mobiliteit').attr('x', 1375).attr('y', 680 + 30).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('MOBILITEIT').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal_industrie').attr('width', 230).attr('height', 300).attr('x', 1350).attr('y', 370).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_finaal_industrie').attr('x', 1375).attr('y', 400).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('INDUSTRIE').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal_landbouw').attr('width', 230).attr('height', 110).attr('x', 1352).attr('y', 250).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_finaal_landbouw').attr('x', 1377).attr('y', 285).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('LANDBOUW').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_finaal_overige').attr('width', 230).attr('height', 200).attr('x', 1352).attr('y', 830).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_finaal_overige').attr('x', 1377).attr('y', 860).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('OVERIGE').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_vlak_conversie').attr('width', 278).attr('height', 945).attr('x', 600).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_vlak_conversie').attr('x', 625).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('CONVERSIE').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_productie').attr('width', 228).attr('height', 945).attr('x', 25).attr('y', 100).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_productie').attr('x', 50).attr('y', 138).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('IMPORT & PRODUCTIE').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_warmteketen_uit').attr('width', 230).attr('height', 110).attr('x', 290).attr('y', 390).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_warmteketen_uit').attr('x', 315).attr('y', 528).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('WARMTEKETEN').style('opacity', 0)

  sankeyCanvas.append('rect').attr('id', 'delineator_rect_warmteproductie_bij_finaal_verbruik_uit').attr('width', 230).attr('height', 305).attr('x', 290).attr('y', 740).attr('fill', '#DCE6EF').attr('rx', 10).attr('ry', 10).style('stroke', '#BBB').style('stroke-width', '0px').style('opacity', 0)
  sankeyCanvas.append('text').attr('id', 'delineator_text_warmteproductie_bij_finaal_verbruik_uit').attr('x', 315).attr('y', 638 + 130).attr('fill', '#666').style('font-weight', 400).style('font-size', '16px').text('LOKAAL').style('opacity', 0)

  // draw scenario buttons
  let spacing = 7
  let cumulativeXpos = 45

  scaleHeight = config.settings[0].scaleHeight

  // console.log(config)

  // only draw buttons once
  // console.log('Checking selectionButtonsHaveInitialized:', selectionButtonsHaveInitialized)
  if (!selectionButtonsHaveInitialized) { // 
    // console.log('About to call drawSelectionButtons...')
    drawSelectionButtons(config)
    // console.log('drawSelectionButtons completed')
    selectionButtonsHaveInitialized = true
  // console.log('Set selectionButtonsHaveInitialized to true')
  } else {
    // console.log('Selection buttons already initialized, skipping...')
  }

  // setTimeout(() => { // TODO: MAKE SEQUENTIAL WITH TOKEN
  //   setScenario() // init
  // }, 1000)

  // Add hover event handlers to links
  sankeyInstances[config.sankeyInstanceID].sankeyDiagram
    .linkTitle((d) => {
      let title = ''
      if (d.carrier === 'co2flow') {
        title = d.carrier + ' | ' + parseInt(d.value * globalCO2flowScale) + ' kton CO2'
      } else {
        // Display the actual value without automatic conversion
        if (currentUnit) {
          title = d.carrier + ' | ' + parseInt(d.value) + ' ' + currentUnit
        } else {
          title = d.carrier + ' | ' + parseInt(d.value)
        }
      }

      // Add annotate information if available
      if (d.annotate && d.annotate.trim() !== '') {
        title += '\n\n' + d.annotate
      }

      return title
    })
    // Skip the problematic mouse events on sankeyDiagram - we'll handle them elsewhere
    // The sankeyDiagram .on() method is causing D3 v7 compatibility issues

  // Ensure links have pointer events enabled
  const linkSelection = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
    .selectAll('.link')
    .style('pointer-events', 'all')
    .style('cursor', 'pointer')

  // Only add mouse events if not disabled (for import compatibility)
  if (!window.disableMouseEvents) {
    linkSelection
      .on('mouseover', function (event, d) {
        showValueOnHover(d3.select(this))
        d3.select(this).style('opacity', 0.8)
      })
      .on('mouseout', function (d) {
        d3.select(this).style('opacity', 1)
        hideValueOnHover()
      })
  }
}

function reSankey (filter, scenario, config) {
  // Update global variables and redraw the Sankey
  globalActiveEnergyflowsFilter = filter
  activeScenario = 0 // scenario - hardcoded to 0, no scenario switching in flux
  currentScenarioID = 0 // scenario - hardcoded to 0, no scenario switching in flux

  // Debug logging
  // console.log('reSankey called with:', {
  //   // filter,
  //   scenario,
  //   configScenarios: config.scenarios,
  //   scenariosLength: config.scenarios ? config.scenarios.length : 'undefined'
  // })

  // Call tick to update the visualization
  tick(config)
}

function tick (config) {
  // console.log('=== TICK DEBUG ===')
  // console.log('tick called with config:', config.sankeyInstanceID)
  // console.log('sankeyInstances keys:', Object.keys(sankeyInstances))
  // console.log('sankeyData available:', !!sankeyData)
  // console.log('sankeyDataObject available:', !!sankeyDataObject)
  // console.log('sankeyDataObject links length:', sankeyDataObject ? sankeyDataObject.links.length : 'N/A')
  // console.log('sankeyDataObject nodes length:', sankeyDataObject ? sankeyDataObject.nodes.length : 'N/A')
  // console.log('config.scenarios:', config.scenarios)
  // console.log('activeScenario:', activeScenario)

  Object.keys(sankeyInstances).forEach(key => {
    // console.log(globalActiveEnergyflowsSankey.id)

    var sankeyData = sankeyDataObject

    sankeyData.links.forEach(item => {
      item.visibility = 1;})
      // console.log(sankeyData)
      // console.log(config)

    for (i = 0; i < sankeyData.links.length; i++) {
      if (config.scenarios && config.scenarios[activeScenario] && config.scenarios[activeScenario].id) {
        const rawValue = sankeyData.links[i][config.scenarios[activeScenario].id]
        // Get decimals setting from config
        const decimals = config.settings && config.settings[0] && config.settings[0].decimalsRoundValues !== undefined ?
          config.settings[0].decimalsRoundValues : 1

        // Don't round small values - preserve them for thin line display
        if (rawValue > 0 && rawValue < 0.5) {
          sankeyData.links[i].value = rawValue // Keep original small value
        } else {
          // Round to the specified number of decimals
          const multiplier = Math.pow(10, decimals)
          sankeyData.links[i].value = Math.round(rawValue * multiplier) / multiplier
        }
      } else {
        // No scenarios - links already have their values set, just keep them
        // console.log('No scenarios configured, using link.value directly for link', i, ':', sankeyData.links[i].value)
        // Don't set to 0! The link already has a value property from the data
        // sankeyData.links[i].value should already be set from processData
      }
    }

    for (i = 0; i < sankeyData.nodes.length; i++) {
      sankeyData.nodes[i].x = sankeyData.nodes[i]['x']
      sankeyData.nodes[i].y = sankeyData.nodes[i]['y']
      sankeyData.nodes[i].title = sankeyData.nodes[i]['title']
    }

    d3.selectAll('#' + config.sankeyInstanceID + '.node-remark-number').remove()
    d3.selectAll('#' + config.sankeyInstanceID + '.node-remarks').remove()

    let sankeyCanvas = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT').append('g')
    for (i = 0; i < sankeyData.nodes.length; i++) {
      // sankeyData.links[i].value = Math.round(sankeyData.links[i][config.scenarios[activeScenario].id])
      // console.log(sankeyData.nodes[i])
      let posx = sankeyData.nodes[i].x + 21
      let posy = sankeyData.nodes[i].y + 15
    /* Static remark drawing code - disabled
    sankeyCanvas.append('path') // EDIT TIJS  - add
      .attr('d', 'M152-160q-23 0-35-20.5t1-40.5l328-525q12-19 34-19t34 19l328 525q13 20 1 40.5T808-160H152Z')
      .attr('class', 'node-remarks')
      .style('pointer-events', 'all')
      .attr('height', 20)
      .attr('dy', sankeyData.nodes[i].y)
      .attr('dx', sankeyData.nodes[i].x)
      .attr('rx', 3).attr('ry', 3)
      .attr('fill', 'black')
      .attr('transform', 'translate(' + posx + ',' + posy + ')scale(0.040)rotate(180)')
      .attr('remarksData', function () {
        return JSON.stringify(sankeyData.nodes[i].remark)
      })
      .attr('fill', function (d) {
        function containsAanname (inputString) {
          // Create a new DOMParser to parse the input string as HTML
          const parser = new DOMParser()
          const parsedHTML = parser.parseFromString(inputString, 'text/html')
          // Check if there are any <info> or <aanname> elements in the parsed HTML
          const infoItems = parsedHTML.querySelectorAll('info')
          const aannameItems = parsedHTML.querySelectorAll('aanname')
          // Return TRUE if at least one <info> or <aanname> item is present, otherwise return FALSE
          return aannameItems.length > 0
        }

        if (containsAanname(sankeyData.nodes[i].remark[currentScenarioID + 1])) {return '#c1121f'} else {return '#495057'} // if only 'info', then 'orange', if 'aanname', then 'red' 
      }).attr('opacity', function (d) { // only show marker if there's info or aanname applicable. Note: used opacity instead of 'visibility' attribute, because visibility attribute is used elsewhere  
        function containsInfoOrAanname (inputString) {
          // Create a new DOMParser to parse the input string as HTML
          const parser = new DOMParser()
          const parsedHTML = parser.parseFromString(inputString, 'text/html')
          // Check if there are any <info> or <aanname> elements in the parsed HTML
          const infoItems = parsedHTML.querySelectorAll('info')
          const aannameItems = parsedHTML.querySelectorAll('aanname')
          const bronItems = parsedHTML.querySelectorAll('bron')
          // Return TRUE if at least one <info> or <aanname> item is present, otherwise return FALSE
          return infoItems.length > 0 || aannameItems.length > 0 || bronItems.length > 0
        }

        if (containsInfoOrAanname(sankeyData.nodes[i].remark[currentScenarioID + 1])) {return 1} else {return 0}
      })

    sankeyCanvas.append('text')
      .attr('class', 'node-remark-number')
      .attr('fill', '#FFF')
      .style('font-weight', 800)
      .style('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dx', -19)
      .attr('dy', 18)
      .attr('transform', 'translate(' + posx + ',' + posy + ')')
      .style('pointer-events', 'none')
      .attr('opacity', function (d) { // only show marker if there's info or aanname applicable. Note: used opacity instead of 'visibility' attribute, because visibility attribute is used elsewhere  
        function containsInfoOrAanname (inputString) {
          // Create a new DOMParser to parse the input string as HTML
          const parser = new DOMParser()
          const parsedHTML = parser.parseFromString(inputString, 'text/html')
          // Check if there are any <info> or <aanname> elements in the parsed HTML
          const infoItems = parsedHTML.querySelectorAll('info')
          const aannameItems = parsedHTML.querySelectorAll('aanname')
          const bronItems = parsedHTML.querySelectorAll('bron')
          // Return TRUE if at least one <info> or <aanname> item is present, otherwise return FALSE
          return infoItems.length > 0 || aannameItems.length > 0 || bronItems.length > 0
        }

        if (containsInfoOrAanname(sankeyData.nodes[i].remark[currentScenarioID + 1])) {return 1} else {return 0}
      })
      .text(function (d) {
        // console.log(d)
        return sankeyData.nodes[i].index + 1}) // start counting at 1 instead of zero
    */
    }

    updateSankey(JSON.stringify(sankeyData), config.settings[0].offsetX, config.settings[0].offsetY, config.settings[0].fontSize, config.settings[0].font, config)
    d3.selectAll('#' + config.sankeyInstanceID + ' .node-title').style('font-size', '11px')

    // Clear the import flag after successful render
    if (window.isImporting) {
      delete window.isImporting
    }
  })
}

function updateSankey (json, offsetX, offsetY, fontSize, fontFamily, config) {
  try {
    var json = JSON.parse(json)
    d3.select('#error').text('')
  } catch (e) { d3.select('#error').text(e); return; }

  if (!(config.sankeyInstanceID in sankeyInstances)) {
    console.error('CRITICAL: sankeyInstance not found for ID:', config.sankeyInstanceID)
    console.error('This should not happen - sankeyInstance should be created in processData')
    return
  }

  sankeyInstances[config.sankeyInstanceID].sankeyLayout.nodePosition(function (node) {
    return [node.x, node.y]
  })

  // Process the data through the sankey layout
  const processedData = sankeyInstances[config.sankeyInstanceID].sankeyLayout.scale(scaleHeight)(json)

  // If importing, skip transition entirely to avoid interpolation with old data
  // Otherwise use normal transition for smooth updates
  if (window.isImporting) {
    d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
      .datum(processedData)
      .call(sankeyInstances[config.sankeyInstanceID].sankeyDiagram)

    // Apply drag behavior immediately (no transition to wait for)
    applyDragBehavior(config)

    // Check for offscreen nodes after render
    if (typeof checkOffscreenNodes === 'function') {
      setTimeout(() => {
        checkOffscreenNodes(config)
      }, 100)
    }
  } else {
    d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
      .datum(processedData)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(sankeyInstances[config.sankeyInstanceID].sankeyDiagram)
      .on('end', function () {
        // Apply drag behavior after the transition is complete
        applyDragBehavior(config)

        // Check for offscreen nodes after sankey is fully rendered
        if (typeof checkOffscreenNodes === 'function') {
          setTimeout(() => {
            checkOffscreenNodes(config)
          }, 100)
        }
      })
  }
  d3.select('#' + config.sankeyInstanceID + ' .sankey').attr('transform', 'translate(' + offsetX + ',' + offsetY + ')')
  d3.selectAll('#' + config.sankeyInstanceID + ' .node-title').style('font-size', fontSize + 'px')

  // Update link styles and events
  const updateLinkSelection = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
    .selectAll('.link')
    .style('pointer-events', 'auto')
    .style('cursor', 'pointer')
    .style('opacity', function (d) { return d.visibility === 0 ? 0 : 0.9 })

  // Only add mouse events if not disabled (for import compatibility)
  if (!window.disableMouseEvents) {
    updateLinkSelection
      .on('mouseover', function (event, d) {
        if (d.visibility !== 0) {
          showValueOnHover(d3.select(this))
          d3.select(this).style('opacity', 0.8)
        }
      })
      .on('mouseout', function (d) {
        if (d.visibility !== 0) {
          d3.select(this).style('opacity', 0.9)
          hideValueOnHover()
        }
      })
  }

  // Click events are always enabled
  updateLinkSelection
    .on('click', function (event, d) {
      // console.log('=== LINK CLICK HANDLER TRIGGERED ===')
      // console.log('Event:', event)
      // console.log('Data:', d)
      // console.log('Visibility:', d ? d.visibility : 'no data')

      if (d && d.visibility !== 0) {
        // console.log('Link click registered - visibility OK')

        // Check if editing mode is available (editLink function exists)
        // console.log('Checking if editLink exists:', typeof editLink)
        // console.log('Checking if window.editLink exists:', typeof window.editLink)
        if (typeof window.editLink === 'function') {
          // console.log('Opening edit dialog for link:', d)
          window.editLink(d, this)
        } else {
          // Fallback to original behavior
          // console.log('Fallback to bar graph - editLink not found')
          if (typeof drawBarGraph === 'function') {
            drawBarGraph(sankeyDataObject.links[d.index], config)
          } else {
            // console.log('drawBarGraph also not available')
          }
        }
      } else {
        // console.log('Link click ignored - visibility is 0 or no data')
      }
    })

  d3.selectAll('#' + config.sankeyInstanceID + ' .node').style('pointer-events', 'auto')
  d3.selectAll('#' + config.sankeyInstanceID + ' .node-backdrop-title').style('pointer-events', 'none')

  d3.selectAll('#' + config.sankeyInstanceID + ' .node-click-target')
    .style('fill', '#555')
    .style('stroke-width', 0)
    .attr('width', 10)
    .attr('rx', 0)
    .attr('ry', 0)
    .attr('transform', 'translate(-4,0)scale(1.005)')
    .attr('id', function (d, i) { return 'nodeindex_' + d.index })
    .on('click', function (event) {
      // console.log('=== NODE CLICK HANDLER TRIGGERED ===')
      // console.log('Event:', event)
      // console.log('Shift key:', event.shiftKey)
      // console.log('This element ID:', this.id)

      // Check for Shift+click for editing
      if (event.shiftKey) {
        // console.log('Shift+click detected, checking if editNode exists:', typeof editNode)
        // console.log('Checking if window.editNode exists:', typeof window.editNode)
        if (typeof window.editNode === 'function') {
          const nodeData = sankeyDataObject.nodes[this.id.slice(10)]
          // console.log('Node shift-clicked for editing:', nodeData)
          window.editNode(nodeData, this)
        } else {
          // console.log('editNode function not found')
        }
      } else {
        // console.log('Regular click - calling original behavior')
        // Original behavior
        if (typeof nodeVisualisatieSingular === 'function') {
          nodeVisualisatieSingular(config, sankeyDataObject.nodes[this.id.slice(10)], sankeyDataObject, config.scenarios, config.targetDIV)
        } else {
          // console.log('nodeVisualisatieSingular not available')
        }
      }
    })
}

function showValueOnHover (value) {
  const formatWithThousandsSeparator = (d) => {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(d); // Format with '.' as thousands separator
  }

  const linkData = value._groups[0][0].__data__
  const originalValue = linkData.value
  const annotate = linkData.annotate || ''
  const carrierColor = linkData.color
  const sourceId = linkData.source.id || linkData.source
  const targetId = linkData.target.id || linkData.target

  d3.select('#showValueOnHover').html(function (d) {
    let mainText = ''
    if (linkData.carrier == 'co2flow') {
      // Show '0' for small values in CO2 flow tooltips too
      const displayValue = (originalValue > 0 && originalValue < 0.5) ? 0 : originalValue
      mainText = linkData.carrier + ' | ' + formatWithThousandsSeparator(parseInt(displayValue * globalCO2flowScale)) + ' kton CO2'
    } else {
      // Show '0' for small values in regular flow tooltips too
      const displayValue = (originalValue > 0 && originalValue < 0.5) ? 0 : originalValue

      // Display the actual value without automatic conversion
      if (currentUnit) {
        mainText = linkData.carrier + ' | ' + formatWithThousandsSeparator(parseInt(displayValue)) + ' ' + currentUnit
      } else {
        mainText = linkData.carrier + ' | ' + formatWithThousandsSeparator(parseInt(displayValue))
      }
    }

    // Build tooltip HTML with colored dot
    let tooltipHTML = '<div class="tooltip-header">'
    tooltipHTML += '<span class="carrier-dot" style="background-color: ' + carrierColor + ';"></span>'
    tooltipHTML += '<span>' + mainText + '</span>'
    tooltipHTML += '</div>'

    // Add source and target information
    tooltipHTML += '<div class="tooltip-annotation">'
    tooltipHTML += '<strong>From:</strong> ' + sourceId + '<br>'
    tooltipHTML += '<strong>To:</strong> ' + targetId
    tooltipHTML += '</div>'

    // Add annotate information if available
    if (annotate && annotate.trim() !== '') {
      tooltipHTML += '<div class="tooltip-annotation">'
      tooltipHTML += '<strong>Annotations:</strong><br>'
      tooltipHTML += annotate.replace(/\n/g, '<br>')
      tooltipHTML += '</div>'
    }

    return tooltipHTML
  })
    .interrupt()
    .style('opacity', 1)
}

function hideValueOnHover () {
  d3.select('#showValueOnHover')
    .interrupt()
    .transition()
    .duration(200)
    .style('opacity', 0)
}

// Functions moved from drawSelectionButtons.js
function drawSelectionButtons (config) {
  // console.log('=== DRAW SELECTION BUTTONS DEBUG ===')
  // console.log('Config scenarios:', config.scenarios)
  // console.log('Config scenarios length:', config.scenarios ? config.scenarios.length : 'undefined')

  // Simplified version - always use first scenario (TNO.ADAPT) and first year (2030)
  let scenarioIdLookup = {
    'TNO.ADAPT': {
      2030: 0,
      2035: 1,
      2040: 2,
      2045: 3,
      2050: 4
    }
  }

  globalActiveScenario = {id: 'TNO.ADAPT', title: 'TNO | ADAPT', color: '#b6c8d3'}
  globalActiveYear = {id: 2030, title: '2030'}

  activeScenario = 0
  currentScenarioID = 0

  // Set global variables
  globalActiveEnergyflowsFilter = 'system'
  if (!globalSankeyInstancesActiveDataset) {
    globalSankeyInstancesActiveDataset = {}
  }
  globalSankeyInstancesActiveDataset[config.sankeyInstanceID] = {id: config.sankeyDataID}

  globalActiveEnergyflowsSankey = globalSankeyInstancesActiveDataset[config.sankeyInstanceID]

  function setScenario () {
    // Simplified: always use the first scenario (index 0)
    activeScenario = 0
    currentScenarioID = 0

    // console.log('=== SET SCENARIO DEBUG ===')
    // console.log('setScenario: Using first scenario (index 0)')
    // console.log('Available config:', config)
    // console.log('About to call reSankey with filter:', globalActiveEnergyflowsFilter, 'scenario:', activeScenario)

    reSankey(globalActiveEnergyflowsFilter, activeScenario, config)
  // console.log('reSankey call completed')
  // drawRemarks(activeScenario)
  }

  // Automatically set the first scenario without creating any buttons
  setScenario()

  // Make variables globally accessible
  window.globalActiveScenario = globalActiveScenario
  window.globalActiveYear = globalActiveYear
  window.globalActiveEnergyflowsFilter = globalActiveEnergyflowsFilter
  window.activeScenario = activeScenario
  window.currentScenarioID = currentScenarioID
}

// Simplified scope selection - always use 'system'
function drawScopeButtons (config) {
  // Simplified - no buttons, just set the scope to 'system' (already set above)
  // The global variables are already initialized in the main function
}

// Function to apply drag behavior to nodes after sankey is fully rendered
function applyDragBehavior (config) {
  // console.log('Setting up drag behavior for sankey:', config.sankeyInstanceID)

  // Add drag functionality to nodes using a different approach
  const drag = d3.drag()
    .on('start', function (event, d) {
      // console.log('Drag started for node:', d.id)
      // Add dragging class and visual feedback
      d3.select(this).classed('dragging', true)
      d3.select(this).style('cursor', 'grabbing')

      // Store original position
      d.fx = d.x0 // Fixed x position
      d.fy = d.y0 // Fixed y position

      // Show grid overlay if snap-to-grid is enabled
      if (window.snapToGrid && typeof showGridOverlay === 'function') {
        showGridOverlay(config)
      }

      // Show drag tooltip with node information
      if (typeof showDragTooltip === 'function') {
        const mousePos = d3.pointer(event, document.body)
        showDragTooltip(d.fx, d.fy, mousePos[0], mousePos[1], d)
      }
    })
    .on('drag', function (event, d) {
      // Use D3's pointer method to get coordinates
      const svgElement = d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT').node()
      let [mouseX, mouseY] = d3.pointer(event, svgElement)

      // Apply snap-to-grid if enabled
      if (window.snapToGrid && window.gridSize) {
        mouseX = Math.round(mouseX / window.gridSize) * window.gridSize
        mouseY = Math.round(mouseY / window.gridSize) * window.gridSize
      }

      // Update the fixed position (this is what D3 sankey uses for positioning)
      d.fx = mouseX
      d.fy = mouseY

      // Update the underlying node data in sankeyDataObject
      const nodeIndex = sankeyDataObject.nodes.findIndex(node => node.id === d.id)
      if (nodeIndex !== -1) {
        sankeyDataObject.nodes[nodeIndex].x = mouseX
        sankeyDataObject.nodes[nodeIndex].y = mouseY
        sankeyDataObject.nodes[nodeIndex].fx = mouseX
        sankeyDataObject.nodes[nodeIndex].fy = mouseY
      }

      // Store the current position for end event
      d.currentX = mouseX
      d.currentY = mouseY

      // Update drag tooltip with current coordinates and node information
      if (typeof updateDragTooltip === 'function') {
        const mousePos = d3.pointer(event, document.body)
        updateDragTooltip(mouseX, mouseY, mousePos[0], mousePos[1], d)
      }

      // Only update visually every few frames for smoother performance
      if (!d.dragThrottle) {
        d.dragThrottle = true
        requestAnimationFrame(() => {
          // Force the sankey layout to use our fixed positions
          sankeyInstances[config.sankeyInstanceID].sankeyLayout.nodePosition(function (node) {
            if (node.id === d.id) {
              return [d.currentX, d.currentY]
            }
            return [node.x || node.x0, node.y || node.y0]
          })

          // Redraw with current data
          const updatedData = JSON.parse(JSON.stringify(sankeyDataObject))
          d3.select('#' + config.sankeyInstanceID + '_sankeySVGPARENT')
            .datum(sankeyInstances[config.sankeyInstanceID].sankeyLayout.scale(scaleHeight)(updatedData))
            .call(sankeyInstances[config.sankeyInstanceID].sankeyDiagram)

          d.dragThrottle = false
        })
      }
    })
    .on('end', function (event, d) {
      // console.log('Drag ended for node:', d.id)
      // Remove dragging class and reset cursor
      d3.select(this).classed('dragging', false)
      d3.select(this).style('cursor', 'grab')

      // Hide grid overlay
      if (typeof hideGridOverlay === 'function') {
        hideGridOverlay()
      }

      // Hide drag tooltip
      if (typeof hideDragTooltip === 'function') {
        hideDragTooltip()
      }

      // CRITICAL FIX: Update window.nodesGlobal with the new position
      if (window.nodesGlobal && Array.isArray(window.nodesGlobal)) {
        const globalNodeIndex = window.nodesGlobal.findIndex(node => node.id === d.id)
        if (globalNodeIndex > -1) {
          // console.log(`Updating global node position for ${d.id}: (${d.currentX}, ${d.currentY})`)
          window.nodesGlobal[globalNodeIndex].x = d.currentX || d.fx
          window.nodesGlobal[globalNodeIndex].y = d.currentY || d.fy
          // Also update alternative position properties if they exist
          if (window.nodesGlobal[globalNodeIndex].x0 !== undefined) {
            window.nodesGlobal[globalNodeIndex].x0 = d.currentX || d.fx
          }
          if (window.nodesGlobal[globalNodeIndex].y0 !== undefined) {
            window.nodesGlobal[globalNodeIndex].y0 = d.currentY || d.fy
          }
        // console.log('Updated global node:', window.nodesGlobal[globalNodeIndex])
        } else {
          console.warn(`Could not find node ${d.id} in window.nodesGlobal to update position`)
        }
      }

      // The position has already been updated during drag, just reapply drag behavior
      setTimeout(() => {
        applyDragBehavior(config)
      }, 100)
    })

  // Apply drag behavior to all nodes
  // console.log('Looking for nodes in:', '#' + config.sankeyInstanceID)
  let nodeSelector = '#' + config.sankeyInstanceID + ' .node'
  // console.log('Node selector:', nodeSelector)

  let nodes = d3.selectAll(nodeSelector)
  // console.log('Found', nodes.size(), 'nodes to make draggable')

  // Try different selectors if the main one doesn't work
  if (nodes.size() === 0) {
    // console.log('No nodes found with main selector, trying alternatives...')
    const altSelectors = [
      '#' + config.sankeyInstanceID + '_sankeySVGPARENT .node',
      '.node',
      '#' + config.sankeyInstanceID + ' g.node'
    ]

    for (let selector of altSelectors) {
      const altNodes = d3.selectAll(selector)
      // console.log('Trying selector', selector, '- found', altNodes.size(), 'nodes')
      if (altNodes.size() > 0) {
        nodes = altNodes
        break
      }
    }
  }

  if (nodes.size() > 0) {
    // console.log('Applying drag behavior to', nodes.size(), 'nodes')
    nodes
      .style('cursor', 'grab')
      .style('pointer-events', 'all')
      .call(drag)
  } else {
    console.warn('No nodes found for drag behavior')
  }
}
