window.lightbox = new (function($) {
    var lightbox = this;

    var Lightbox = lightbox.Lightbox = function() {
        if (arguments.length) {
            this.initialize.apply(this, arguments);
        }
    };

    Lightbox.defaultSettings = {
        'slideSelector': 'li',
        'images': 'img',
        'urlFromImage': function(img) {
            return img.closest('a').attr('href');
        },
        'overlay': '<div class="overlay"></div>',
        'popup':
            '<div class="popup">' +
            '<div class="imagelist-container">' +
            '<div class="imagelist"><div class="imageitem"></div></div>' +
            '</div><div class="navlist-container">' +
            '<div class="navlist"><div class="navitem"></div></div>' +
            '</div></div>',
        'slowDown': 1.2,
        'scrollTime': 400};

    Lightbox.prototype.initialize = function(el, settings) {
        this.el = $(el);
        this.settings = $.extend({}, Lightbox.defaultSettings, settings);

        this.open = false;
        this.index = 0;
        this.build();
    };

    Lightbox.prototype.build = function() {
        this.images = $(this.settings.images);
        this.overlay = $(this.settings.overlay);
        if (!this.overlay.parent().length) {
            console.log('appending overlay');
            this.overlay.appendTo('body').hide();
        }
        this.popup = $(this.settings.popup);
        if (!this.popup.parent().length) {
            this.popup.appendTo('body').hide();
        }
        this.navItemTemplate = this.popup.find('.navitem').remove();
        this.imageItemTemplate = this.popup.find('.imageitem').remove();

        this.buildImageList();
        this.buildNavList();
        this.images.bind('click', this.onImageClick.bind(this));
    };

    Lightbox.prototype.onImageClick = function(e) {
        e.preventDefault();
        var src = $(e.target).attr('src');
        this.showPopup(this.indexFromSrc(src));
    };

    Lightbox.prototype.onNavItemClick = function(e) {
        e.preventDefault();
        var navItem = $(e.target).closest('.navitem');
        this.navigateTo(navItem.index());
    };

    Lightbox.prototype.onNavTouchStart = function(e) {
        if (this.moving) {
            return;
        }
        this.moving = true;
        this.lastNavDelta = 0;
        this.totalNavDelta = 0;
        var touch =
            e.originalEvent.touches ? e.originalEvent.touches[0] : e;
        this.currTouchX = this.startTouchX = touch.clientX;
        return false;
    };

    Lightbox.prototype.onNavTouchMove = function(e) {
        if (!this.moving) {
            return;
        }
        var touch =
            e.originalEvent.touches ? e.originalEvent.touches[0] : e;
        var touchX = touch.clientX;
        var deltaX = this.currTouchX - touchX;
        var container = this.popup.find('.navlist-container');
        var currScrollLeft = container.get(0).scrollLeft;
        if (deltaX > 0 &&
                currScrollLeft <
                    this.popup.find('.navlist').outerWidth() -
                    this.popup.find('.navimage').last().outerWidth()) {
            container.get(0).scrollLeft += deltaX;
        } else if (deltaX < 0 && currScrollLeft > 0) {
            container.get(0).scrollLeft += deltaX;
        }
        this.currTouchX = touchX;
        this.lastNavDelta = deltaX;
        this.totalNavDelta = this.startTouchX - touchX;
        return false;
    };

    Lightbox.prototype.onNavTouchEnd = function(e) {
        this.moving = false;
        if (this.totalNavDelta < 5 && this.totalNavDelta > -5) {
            this.onNavItemClick(e);
            return false;
        }
        if (this.lastNavDelta) {
            this.slowDownCycle(this.lastNavDelta);
        }
        return false;
    };

    Lightbox.prototype.onImageTouchStart = function(e) {
        if (this.swiping) {
            return;
        }
        this.swiping = true;
        this.totalImageDelta = 0;
        this.startImageX =
            e.originalEvent.touches ?
                e.originalEvent.touches[0].clientX : e.clientX;
        return false;
    };

    Lightbox.prototype.onImageTouchMove = function(e) {
        if (!this.swiping) {
            return;
        }
        this.totalImageDelta =
            this.startImageX - (
                e.originalEvent.touches ?
                    e.originalEvent.touches[0].clientX : e.clientX);
        return false;
    };

    Lightbox.prototype.onImageTouchEnd = function(e) {
        if (!this.swiping) {
            return;
        }
        this.swiping = false;
        if (this.totalImageDelta > 5 && this.index < this.images.length - 1) {
            // swipe to right
            this.navigateTo(this.index + 1);
        } else if (this.totalImageDelta > -5 && this.index > 0) {
            // swipe to left
            this.navigateTo(this.index - 1);
        }
    };

    Lightbox.prototype.showPopup = function(index) {
        if (!this.open) {
            console.log('showPopup', this.overlay);
            this.overlay.show();
            this.popup.show();
            this.open = true;
        }
        this.navigateTo(this.index);
    };

    Lightbox.prototype.buildNavList = function() {
        this.images.each(function(i, el) {
            this.buildNavItem($(el));
        }.bind(this));
        var navlist = this.popup.find('.navlist');
        navlist.bind('touchstart mousedown', this.onNavTouchStart.bind(this));
        navlist.bind('touchmove mousemove', this.onNavTouchMove.bind(this));
        navlist.bind('touchend mouseup', this.onNavTouchEnd.bind(this));
        navlist.width(
            this.images.length * this.popup.find('.navitem').outerWidth());
    };

    Lightbox.prototype.buildNavItem = function(img) {
        this.navItemTemplate
            .clone()
            .appendTo(this.popup.find('.navlist'))
            .append(
                $('<img />').attr('src', img.attr('src')));
    };

    Lightbox.prototype.buildImageList = function() {
        this.images.each(function(i, el) {
            this.buildImageItem($(el));
        }.bind(this));
        //this.popup.find('.imageitem').each(this.onImageClick.bind(this));
        var imagelist = this.popup.find('.imagelist');
        imagelist.bind('touchstart mousedown', this.onImageTouchStart.bind(this));
        imagelist.bind('touchmove mousemove', this.onImageTouchMove.bind(this));
        imagelist.bind('touchend mouseend', this.onImageTouchEnd.bind(this));
        imagelist.width(
            this.images.length * this.popup.find('.imageitem').outerWidth());
    };

    Lightbox.prototype.buildImageItem = function(img) {
        var largeUrl = this.settings.urlFromImage(img);
        this.imageItemTemplate
            .clone()
            .appendTo(this.popup.find('.imagelist'))
            .append(
                $('<img />').attr('src', largeUrl));
    };

    Lightbox.prototype.slowDownCycle = function(speed) {
        if (this.moving) {
            // new touch started, stop slowdown
            return;
        }
        var container = this.popup.find('.navlist-container').get(0);
        var currScrollLeft = container.scrollLeft;
        if ((speed < 0 && currScrollLeft > 0) ||
                (speed > 0 &&
                    currScrollLeft <
                        this.popup.find('.navlist').outerWidth() -
                        this.images.last().outerWidth())) {
            container.scrollLeft += speed;
        }
        speed = Math.floor(speed / this.settings.slowDown);
        if (speed > 5 || speed < -5) {
            window.setTimeout(this.slowDownCycle.bind(this, speed), 100);
        } else {
            //this.animateToSlide();
        }
    };

    Lightbox.prototype.navigateTo = function(index) {
        var offset = this.popup.find('.imageitem').eq(index).offset().left;
        var scrollX = this.popup.find('.imagelist-container').get(0).scrollLeft;
        alert('navigateTo: ' + index + ' (' + offset + ', ' + scrollX + ')');
        this.popup.find('.imagelist-container').animate(
            {'scrollLeft': (offset - scrollX) + 'px'},
            this.settings.scrollTime);
        this.index = index;
    };

    Lightbox.prototype.indexFromSrc = function(src) {
        for (var i = 0; i < this.images.length; i++) {
            if ($(this.images[i]).attr('src') == src) {
                console.log('found src:', i);
                return i;
            }
        }
        return -1;
    };

    $.fn.lightbox = function(settings) {
        this.each(function(settings) {
            this.data('lightbox', new Lightbox(this, settings));
        }.bind(this, settings));
        return this;
    };
})($);
