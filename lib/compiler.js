var AstBuilder = require('./ast-builder');

function Compiler() {
    this._stringResultHandler = function (res) {
        return 'function(){return ' + JSON.stringify(res) + ';}';
    };
    this._helpers = {};
    this._blockHelpers = {};
}

Compiler.prototype.setStringResultHandler = function (handler) {
    this._stringResultHandler = handler;
};

Compiler.prototype.registerHelper = function (helperName, processor) {
    this._helpers[helperName] = processor;
};

Compiler.prototype.registerBlockHelper = function (helperName, processor) {
    this._blockHelpers[helperName] = processor;
};

Compiler.prototype.compile = function (ast) {
    if (
        ast.type === AstBuilder.TYPE_ROOT &&
        ast.items.length === 1 &&
        ast.items[0].type === AstBuilder.TYPE_TEXT
    ) {
        return this._stringResultHandler(ast.items[0].value);
    } else {
        return 'function(params){return ' + this.compileThread(ast) + ';}';
    }
};

Compiler.prototype.compileThread = function (ast) {
    switch (ast.type) {
        case AstBuilder.TYPE_TEXT:
            return JSON.stringify(ast.value);
        case AstBuilder.TYPE_EXPRESSION:
            return this.generateExpression(ast.value);
        case AstBuilder.TYPE_CALL:
            if (this._helpers[ast.name]) {
                return this._helpers[ast.name](ast, this);
            } else {
                throw new Error('Helper "' + ast.name + '" was not found');
            }
            break;
        case AstBuilder.TYPE_SECTION:
            return ast.items.map(this.compileThread, this).join('+');
        case AstBuilder.TYPE_ROOT:
            return ast.items.map(this.compileThread, this).join('+');
        case AstBuilder.TYPE_BLOCK:
            if (this._blockHelpers[ast.name]) {
                return this._blockHelpers[ast.name](ast, this);
            } else {
                throw new Error('Block helper "' + ast.name + '" was not found');
            }
            break;
        default:
            throw new Error('Unknown thread: "' + ast.type + '"');
    }
};

Compiler.prototype.generateVariableInsertion = function (variableName) {
    return 'params.' + variableName;
};

Compiler.prototype.generateExpression = function (val) {
    if (val.type === AstBuilder.TYPE_STRING) {
        return JSON.stringify(val.value);
    } else if (val.type === AstBuilder.TYPE_VARIABLE) {
        return this.generateVariableInsertion(val.name);
    } else {
        throw new Error('Unknown expression: ' + val.type);
    }
};

module.exports = Compiler;
