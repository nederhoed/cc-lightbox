if (!Function.prototype.bind) {
    Function.prototype.bind = function(context) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        var func = this;
        return function() {
            var subArgs = ([]).concat(args);
            for (var i = 0; i < arguments.length; i++) {
                subArgs.push(arguments[i]);
            }
            return func.apply(context, subArgs);
        }
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(item) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == item) {
                return i;
            }
        }
        return -1;
    };
}
