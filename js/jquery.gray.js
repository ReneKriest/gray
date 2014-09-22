define(function (require) {
  var jquery = require('jquery');

  (function ($, window, document, undefined) {
    'use strict';

    var pluginName = 'gray',
      defaults = {
        fade: false,
        classes: {
          fade: 'grayscale-fade'
        }
      };

    function Plugin(element, options) {
      var classes,
        fadeClass;

      options = options || {};

      classes = options.classes || {};
      fadeClass = classes.fade || defaults.classes.fade;
      options.fade = options.fade || element.className.indexOf(fadeClass) > -1;

      this.element = element;
      this.settings = $.extend({}, defaults, options);
      this._defaults = defaults;
      this._name = pluginName;
      this.init();
    }

    Plugin.prototype = {

      init: function () {
        var element;
        // Modernizr.cssfilters === true --> use CSS class, else use fix if svg is available
        if (!Modernizr.cssfilters && Modernizr.inlinesvg /* && Modernizr.svgfilters */) {
          element = $(this.element);

          if (this.cssFilterDeprecated(element) || this.settings.fade) {
            this.switchImage(element);
          }
        }
      },

      cssFilterDeprecated: function (element) {
        return element.css('filter') === 'none';
      },

      getComputedStyle: function (element) {
        var computedStyle = {},
          styles = {};

        computedStyle = window.getComputedStyle(element, null);

        for (var i = 0, length = computedStyle.length; i < length; i++) {
          var prop = computedStyle[i];
          styles[prop] = computedStyle.getPropertyValue(prop);
        }

        return styles;
      },

      extractUrl: function (backgroundImage) {
        var url,
          regex,
          startRegex = /^url\(["']?/,
          endRegex = /["']?\)$/;
        url = backgroundImage.replace(startRegex, '')
          .replace(endRegex, '');

        return url;
      },

      positionToNegativeMargin: function (backgroundPosition) {
        var x,
          y,
          margin;

        x = backgroundPosition.match(/^(-?\d+\S+)/)[0]
        y = backgroundPosition.match(/\s(-?\d+\S+)$/)[0]

        margin = 'margin:' + y + ' 0 0 ' + x;

        return margin;
      },

      getBgSize: function (url, backgroundSize) {
        var img,
          ratio,
          defaultW,
          w,
          defaultH,
          h,
          size;

        img = new Image();
        img.src = url;

        // TODO: Break this up or simplify
        if (backgroundSize !== 'auto' && backgroundSize !== 'cover' && backgroundSize !== 'contain' && backgroundSize !== 'inherit') {
          var $element = $(this.element);

          ratio = img.width / img.height;
          w = parseInt((backgroundSize.match(/^(\d+)px/) || [0, 0])[1]);
          h = parseInt((backgroundSize.match(/\s(\d+)px$/) || [0, 0])[1]);
          defaultW = $element.height() * ratio;
          defaultH = $element.width() / ratio;
          w = w || defaultW;
          h = h || defaultH;
        }

        if (w || h) {
          size = {
            width: w,
            height: h
          };
        } else {

          size = {
            width: img.width,
            height: img.height
          };
        }

        return size;
      },

      // Image oder Background-Image
      getParams: function (element) {
        return (element.prop('tagName') === 'IMG') ? this.getImgParams(element) : this.getBgParams(element);
      },

      getImgParams: function (element) {
        var params = {};

        params.styles = this.getComputedStyle(element[0]);

        params.svg = {
          url: element[0].src,
          width: params.styles.width.replace('px', ''),
          height: params.styles.height.replace('px', ''),
          offset: ''
        };

        return params;
      },

      getBgParams: function (element) {
        var params = {},
          position,
          url = this.extractUrl(element.css('background-image')),
          bgSize = this.getBgSize(url, element.css('background-size')),
          offset = this.positionToNegativeMargin(element.css('background-position'));

        params.styles = this.getComputedStyle(element[0]);

        params.svg = $.extend(
          { url: url },
          bgSize,
          { offset: offset }
        );

        return params;
      },

      setFadeStyles: function (styles, url) {
        styles['background-image'] = 'url("' + url + '")';
        delete styles['filter'];

        return styles;
      },

      switchImage: function (element) {
        var params,
          classes,
          template;

        params = this.getParams(element);

        classes = this.settings.fade ? this.settings.classes.fade : '';

        // h/w dynamically
        var node = element.get(0);
        var nodeRect = node.getBoundingClientRect();

        params.svg.width = nodeRect.width;
        params.svg.height = nodeRect.height;

        // TODO: use templating or DOM elements here
        template = $(
          '<div class="grayscale-replaced ' + classes + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + params.svg.width + ' ' + params.svg.height + '" width="' + params.svg.width + '" height="' + params.svg.height + '">' +
            '<defs>' +
            '<filter id="gray">' +
            '<feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0" />' +
            '</filter>' +
            '</defs>' +
            '<image filter="url(&quot;#gray&quot;)" x="0" y="0" width="' + params.svg.width + '" height="' + params.svg.height + '" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + params.svg.url + '" />' +
            '</svg>' +
            '</div>');

        params.styles['display'] = 'inline-block';
        params.styles['overflow'] = params.styles['overflow-x'] = params.styles['overflow-y'] = 'hidden';

        if (this.settings.fade) {
          params.styles = this.setFadeStyles(params.styles, params.svg.url);
        }

        // TODO: Should this really set all params or should we set only unique ones by comparing to a control element?
        //template.css(params.styles);
        template.css({
          'display': 'inline-block'
        });

        element.replaceWith(template);
      }
    };

    $.fn[pluginName] = function (options) {
      this.each(function () {
        if (!$.data(this, 'plugin_' + pluginName)) {
          $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        }
      });
      return this;
    };
  })(jQuery, window, document);
});
