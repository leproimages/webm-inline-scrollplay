// Based at https://github.com/embedly/jquery-embedly-scrollplay
/* globals jQuery:true */

;(function ( $, window, document, undefined ) {

  // An object that keeps track of all the videos on the page.
  var Scroller = function(videos){
    this.init(videos);
  };

  Scroller.prototype.init = function(videos){
    this.data = [];

    videos.each($.proxy(function(i, elem){
      this.add($(elem));
    }, this));

    // We call scrolled here as most likely something into frame already.
    // TODO: We should do that only for visible videos at viewport and once
    videos.on('loadedmetadata', $.proxy(function(){
      this.scrolled();
    }, this));
  };

  // Add the elements positioning data.
  Scroller.prototype.add = function($elem){
    var t = $elem.offset().top;

    this.data.push({
      $elem: $elem,
    });
  };

  // Called by the on scroll event.
  Scroller.prototype.scrolled = function(){
    var $window = $(window);

    // Get the scrollTop and scrollBottom.
    var t = $window.scrollTop();
    var b = t + $window.innerHeight();

    // It possible to have multiple videos inframe, so we only want to play
    // the first one or the one that totally in frame (percentage - 100%).
    $.each($.map(this.data, function(obj, i){
      // Height and position of the embed.
      var h = obj.$elem.innerHeight();
      var top = obj.$elem.offset().top;
      var bottom = top + h;
      // We need to find the percentage of the video that's in frame.
      var p = 0;

      // There is overlap of the window and embed.
      if (top <= b && bottom >= t) {
        // Based on the window, figure out percentages.
        if (bottom > b){
          p = (b - top) / h;
        } else if (top < t){
          p = (bottom - t) / h;
        } else {
          p = 1;
        }
      }

      // Stripped down object of what we need.
      return {
        p: p,
        t: top,
        node: obj.$elem[0]
      };
    }).sort(function(a, b){
      // Sort based on percentages.
      if (a.p > b.p){
        return -1;
      } else if (a.p < b.p) {
        return 1;
      }

       // If the percentages are equal, use the one higher on the page.
      if (a.t < b.t){
        return -1;
      } else if (a.t > b.t){
        return 1;
      }
      return 0;
    }), function(i, obj){

      // The first obj in the list should be the one we want to play, but
      // make sure it totally inframe.
      if (i === 0 && obj.p == 1.0){
        obj.node.play();
      } else {
        // pause the rest.
        obj.node.pause();
      }
    });
  };

  // Called when the window is resized. It allows use to update the data
  // to with the new top and bottom. It's a bit faster to do this, as window
  // resize isn't called all that often.
  Scroller.prototype.resized = function(){
    $.each(this.data, function(i, obj){
      obj.top = obj.$elem.offset().top;
      obj.bottom = obj.top + obj.$elem.height();
    });

    // We call scrolled here as most likely something went out of frame.
    this.scrolled();
  };

  Scroller.prototype.listen = function(){
    var $window = $(window);

    // Listen to the scroll event.
    $window.on('scroll', $.proxy(function(){

      // Nothings ready yet.
      if (this.data.length === 0){
        return false;
      }

      this.scrolled();
    }, this));

    // Listen to the resize event.
    $window.on('resize', $.proxy(function(){

      // Nothings ready yet.
      if (this.data.length === 0){
        return false;
      }

      this.resized();
    }, this));
  };

  $.fn.scrollplay = function() {
    var scroller = new Scroller(this);
    scroller.listen();
    return this;
  };

})( jQuery, window, document );