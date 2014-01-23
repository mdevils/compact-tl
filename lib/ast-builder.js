var Parser = require('./parser');

function AstBuilder() {
    this._blockSections = {};
}

AstBuilder.prototype.build = function (parser) {
    var topSection = {
        type: AstBuilder.TYPE_ROOT,
        items: []
    };
    this._processSection(parser, topSection, null);
    parser.require(Parser.TOKEN_EOF);
    return topSection;
};

AstBuilder.prototype._processSection = function (parser, section, block) {
    while (!parser.is(Parser.TOKEN_EOF)) {
        if (parser.is(Parser.TOKEN_BEGIN_CLOSE_BLOCK_EXPRESSION)) {
            if (block && parser.isNext(Parser.TOKEN_IDENTIFIER, block.name)) {
                return;
            } else {
                parser.require(Parser.TOKEN_TEXT);
            }
        } else if (parser.is(Parser.TOKEN_TEXT)) {
            section.items.push({
                type: AstBuilder.TYPE_TEXT,
                value: parser.getToken().value
            });
            parser.next();
        } else if (parser.is(Parser.TOKEN_BEGIN_EXPRESSION)) {
            parser.next();
            if (parser.is(Parser.TOKEN_IDENTIFIER)) {
                var identName = parser.getToken().value;
                if (
                    block &&
                    this._blockSections[block.name] &&
                    this._blockSections[block.name][parser.getToken().value]
                ) {
                    parser.next();
                    var subSection = {
                        type: AstBuilder.TYPE_SECTION,
                        name: identName,
                        arguments: this._parseArguments(parser),
                        items: []
                    };
                    parser.require(Parser.TOKEN_END_EXPRESSION);
                    parser.next();
                    block.sections.push(subSection);
                    this._processSection(parser, subSection, block);
                    return;
                } else if (parser.isNext(Parser.TOKEN_END_EXPRESSION)) {
                    section.items.push({
                        type: AstBuilder.TYPE_EXPRESSION,
                        value: this._parseSubExpression(parser)
                    });
                    parser.require(Parser.TOKEN_END_EXPRESSION);
                    parser.next();
                } else {
                    parser.next();
                    section.items.push({
                        name: identName,
                        type: AstBuilder.TYPE_CALL,
                        arguments: this._parseArguments(parser)
                    });
                    parser.require(Parser.TOKEN_END_EXPRESSION);
                    parser.next();
                }
            } else {
                section.items.push({
                    type: AstBuilder.TYPE_EXPRESSION,
                    value: this._parseSubExpression(parser)
                });
                parser.require(Parser.TOKEN_END_EXPRESSION);
                parser.next();
            }
        } else if (parser.is(Parser.TOKEN_BEGIN_BLOCK_EXPRESSION)) {
            parser.next();
            parser.require(Parser.TOKEN_IDENTIFIER);
            var blockName = parser.getToken().value;
            parser.next();
            var mainSection = {
                name: null,
                type: AstBuilder.TYPE_SECTION,
                arguments: {list: [], hash: {}},
                items: []
            };
            var subBlock = {
                name: blockName,
                type: AstBuilder.TYPE_BLOCK,
                arguments: this._parseArguments(parser),
                mainSection: mainSection,
                sections: []
            };
            parser.require(Parser.TOKEN_END_EXPRESSION);
            parser.next();
            section.items.push(subBlock);
            this._processSection(parser, mainSection, subBlock);
            parser.require(Parser.TOKEN_BEGIN_CLOSE_BLOCK_EXPRESSION);
            parser.next();
            parser.require(Parser.TOKEN_IDENTIFIER, blockName);
            parser.next();
            parser.require(Parser.TOKEN_END_EXPRESSION);
            parser.next();
        } else {
            parser.require(Parser.TOKEN_TEXT);
        }
    }
};

AstBuilder.prototype._parseArguments = function (parser) {
    var argList = [];
    var argHash = {};
    while (!parser.is(Parser.TOKEN_END_EXPRESSION)) {
        if (parser.is(Parser.TOKEN_STRING)) {
            argList.push(this._parseSubExpression(parser));
        } else if (parser.is(Parser.TOKEN_IDENTIFIER)) {
            var ident = parser.getToken().value;
            if (parser.isNext(Parser.TOKEN_OPERATOR, '=')) {
                parser.next();
                parser.next();
                argHash[ident] = this._parseSubExpression(parser);
            } else {
                argList.push(this._parseSubExpression(parser));
            }
        } else {
            parser.require(Parser.TOKEN_END_EXPRESSION);
        }
    }
    return {
        list: argList,
        hash: argHash
    };
};

AstBuilder.prototype._parseSubExpression = function (parser) {
    var thread = {};
    if (parser.is(Parser.TOKEN_IDENTIFIER)) {
        thread.type = AstBuilder.TYPE_VARIABLE;
        thread.name = parser.getToken().value;
        parser.next();
    } else if (parser.is(Parser.TOKEN_STRING)) {
        thread.type = AstBuilder.TYPE_STRING;
        thread.value = parser.getToken().value;
        parser.next();
    } else {
        parser.require(Parser.TOKEN_IDENTIFIER);
    }
    return thread;
};

AstBuilder.prototype.registerBlockSection = function (blockName, sectionName) {
    if (!this._blockSections[blockName]) {
        this._blockSections[blockName] = {};
    }
    this._blockSections[blockName][sectionName] = true;
};

module.exports = AstBuilder;

AstBuilder.TYPE_ROOT = 'root';
AstBuilder.TYPE_TEXT = 'text';
AstBuilder.TYPE_CALL = 'call';
AstBuilder.TYPE_EXPRESSION = 'expression';
AstBuilder.TYPE_BLOCK = 'block';
AstBuilder.TYPE_SECTION = 'section';
AstBuilder.TYPE_VARIABLE = 'variable';
AstBuilder.TYPE_STRING = 'string';
