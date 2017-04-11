function renderGraph(graphToRender, urls) {


  sigma.utils.pkg('sigma.canvas.nodes');
  sigma.canvas.nodes.image = (function () {
    var _cache = {},
      _loading = {},
      _callbacks = {};

    // Return the renderer itself:
    var renderer = function (node, context, settings) {
      var args = arguments,
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'],
        color = node.color || settings('defaultNodeColor'),
        url = node.url;

      if (_cache[url]) {
        context.save();

        // Draw the clipping disc:
        context.beginPath();
        context.arc(
          node[prefix + 'x'],
          node[prefix + 'y'],
          node[prefix + 'size'],
          0,
          Math.PI * 2,
          true
        );
        context.closePath();
        context.clip();

        // Draw the image
        context.drawImage(
          _cache[url],
          node[prefix + 'x'] - size,
          node[prefix + 'y'] - size,
          2 * size,
          2 * size
        );

        // Quit the "clipping mode":
        context.restore();

        // Draw the border:
        context.beginPath();
        context.arc(
          node[prefix + 'x'],
          node[prefix + 'y'],
          node[prefix + 'size'],
          0,
          Math.PI * 2,
          true
        );
        context.lineWidth = 1.5;
        context.strokeStyle = node.color || settings('defaultNodeColor');
        context.stroke();
      } else {
        sigma.canvas.nodes.image.cache(url);
        sigma.canvas.nodes.def.apply(
          sigma.canvas.nodes,
          args
        );
      }
    };

    // Let's add a public method to cache images, to make it possible to
    // preload images before the initial rendering:
    var t = 0;
    var z = 0;
    var x = 0;
    var y = 0;
    renderer.cache = function (url, callback) {

      if (callback)
        _callbacks[url] = callback;
      t++;

      var img = new Image();

      img.onload = function () {
        _loading[url] = false;
        _cache[url] = img;

        if (_callbacks[url]) {
          _callbacks[url].call(this, img);

        }
      };

      _loading[url] = true;
      img.src = url;
    };

    return renderer;
  })();

  // Now that's the renderer has been implemented, let's generate a graph
  // to render:
  var loaded = 0;
  
  urls.forEach(function (url) {
    sigma.canvas.nodes.image.cache(url, function () {
      if (++loaded === urls.length) {

       
        s = new sigma({
          graph: graphToRender,
          renderer: {
            // IMPORTANT:
            // This works only with the canvas renderer, so the
            // renderer type set as "canvas" is necessary here.
            container: document.getElementById('graph-container'),
            type: 'canvas'
          },
          settings: {
            minNodeSize: 8,
            maxNodeSize: 32,
            drawLabels: false,
            singleHover: true,
            edgeHoverSizeRatio: 3,
            enableEdgeHovering: true,
            edgeHoverExtremities: true,
            //autoRescale: ['nodePosition', 'edgeSize'],


          }
        });

        
        var noverlapListener = s.configNoverlap({
          nodeMargin: 2.0,
          scaleNodes: 1.00,
          gridSize: 75,
          
        });
        // Bind the events:
        noverlapListener.bind('start stop interpolate', function (e) {
          console.log(e.type);
          if (e.type === 'start') {
            console.time('noverlap');
          }
          if (e.type === 'interpolate') {
            console.timeEnd('noverlap');
          }
        });
        // Start the layout:
        s.startNoverlap();
      };


    });
  });




}