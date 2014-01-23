var Parser = require('./parser');
var Compiler = require('./compiler');
var AstBuider = require('./ast-builder');

function CompactTL() {
    this._builder = new AstBuider();
    this._compiler = new Compiler();
}

CompactTL.prototype.use = function (extension) {
    extension(this._builder, this._compiler);
};

CompactTL.prototype.process = function (input) {
    return this._compiler.compile(this._builder.build(new Parser(input)));
};

module.exports = CompactTL;
