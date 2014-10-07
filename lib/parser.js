var STATE_TEXT = 1;
var STATE_BRACKET_EXPRESSION = 2;

var OPERATORS = {
    '=': true,
    '==': true,
    '!=': true,
    '>': true,
    '<': true,
    '>=': true,
    '<=': true
};

function Parser(source) {
    this._source = source;
    this._token = null;
    this._pos = 0;
    this._state = STATE_TEXT;
    this.next();
}

Parser.prototype.next = function () {
    var source = this._source;
    var pos = this._pos;
    var char = source.charAt(pos);
    var len = source.length;
    var resultToken = {
        pos: pos
    };
    if (pos === len) {
        resultToken.type = Parser.TOKEN_EOF;
    } else if (this._state === STATE_TEXT) {
        if (char === '{' && source.charAt(pos + 1) === '{') {
            pos += 2;
            this._state = STATE_BRACKET_EXPRESSION;
            char = source.charAt(pos);
            if (char === '#') {
                resultToken.type = Parser.TOKEN_BEGIN_BLOCK_EXPRESSION;
                pos++;
            } else if (char === '/') {
                resultToken.type = Parser.TOKEN_BEGIN_CLOSE_BLOCK_EXPRESSION;
                pos++;
            } else {
                resultToken.type = Parser.TOKEN_BEGIN_EXPRESSION;
            }
        } else {
            var text = '';
            do {
                if (pos === len) {
                    break;
                }
                char = source.charAt(pos);
                if (char === '{' && source.charAt(pos + 1) === '{') {
                    break;
                } else {
                    text += char;
                    pos++;
                }
            } while (true);
            resultToken.type = Parser.TOKEN_TEXT;
            resultToken.value = text;
        }
    } else if (this._state === STATE_BRACKET_EXPRESSION) {
        while (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
            pos++;
            if (pos === len) {
                break;
            }
            char = source.charAt(pos);
        }
        resultToken.pos = pos;
        var dblChar = char + source.charAt(pos + 1);
        if (pos === len) {
            resultToken.type = Parser.TOKEN_EOF;
        } else if (dblChar.length === 2 && OPERATORS[dblChar]) {
            pos += 2;
            resultToken.type = Parser.TOKEN_OPERATOR;
            resultToken.value = dblChar;
        } else if (OPERATORS[char]) {
            pos++;
            resultToken.type = Parser.TOKEN_OPERATOR;
            resultToken.value = char;
        } else if (char === '"' || char === '\'') {
            var str = '';
            var quote = char;
            pos++;
            char = source.charAt(pos);
            while (char !== quote && pos < len) {
                if (char === '\\') {
                    pos++;
                    char = source.charAt(pos);
                    switch (char) {
                        case 'n':
                            str += '\n';
                            break;
                        case 'r':
                            str += '\r';
                            break;
                        case 't':
                            str += '\t';
                            break;
                        default:
                            str += char;
                    }
                    pos++;
                    char = source.charAt(pos);
                } else {
                    str += char;
                    pos++;
                    char = source.charAt(pos);
                }
            }
            if (char === quote) {
                pos++;
            }
            resultToken.type = Parser.TOKEN_STRING;
            resultToken.value = str;
        } else if (char === '}' && source.charAt(pos + 1) === '}') {
            pos += 2;
            resultToken.type = Parser.TOKEN_END_EXPRESSION;
            this._state = STATE_TEXT;
        } else if (isIdentifierStart(char)) {
            var ident = char;
            pos++;
            char = source.charAt(pos);
            while (isIdentifierPart(char) && pos < len) {
                ident += char;
                pos++;
                char = source.charAt(pos);
            }
            resultToken.type = Parser.TOKEN_IDENTIFIER;
            resultToken.value = ident;
        } else if (isNumber(char)) {
            var number = char;
            pos++;
            char = source.charAt(pos);
            while (isNumber(char) && pos < len) {
                number += char;
                pos++;
                char = source.charAt(pos);
            }
            resultToken.type = Parser.TOKEN_NUMBER;
            resultToken.value = number;
        }
    }
    this._pos = pos;
    this._token = resultToken;
};

/**
 * @param {String} tokenType
 * @param {String} tokenValue
 * @returns {Boolean}
 */
Parser.prototype.is = function (tokenType, tokenValue) {
    var token = this._token;
    return tokenType === token.type && (tokenValue === undefined || tokenValue === token.value);
};

Parser.prototype.isNext = function (tokenType, tokenValue) {
    var state = this._state;
    var token = this._token;
    var pos = this._pos;
    this.next();
    var result = this.is(tokenType, tokenValue);
    this._state = state;
    this._token = token;
    this._pos = pos;
    return result;
};

Parser.prototype.require = function (tokenType, tokenValue) {
    if (!this.is(tokenType, tokenValue)) {
        throw new Error(
            'Token "' + tokenType + '"' + (tokenValue !== undefined ? ' with value "' + tokenValue + '"' : '') +
            ' expected but "' + this._token.type + '"' +
            (this._token.value !== undefined ? ' with value "' + this._token.value + '"' : '') + ' found'
        );
    }
};

var CODE_LOWER_A = ('a').charCodeAt(0);
var CODE_LOWER_Z = ('z').charCodeAt(0);
var CODE_UPPER_A = ('A').charCodeAt(0);
var CODE_UPPER_Z = ('Z').charCodeAt(0);
var CODE_0 = ('0').charCodeAt(0);
var CODE_9 = ('9').charCodeAt(0);

function isIdentifierStart(char) {
    var charCode = char.charCodeAt(0);
    return char === '_' ||
        (charCode >= CODE_LOWER_A && charCode <= CODE_LOWER_Z) ||
        (charCode >= CODE_UPPER_A && charCode <= CODE_UPPER_Z);
}

function isIdentifierPart(char) {
    var charCode = char.charCodeAt(0);
    return char === '_' ||
        (charCode >= CODE_LOWER_A && charCode <= CODE_LOWER_Z) ||
        (charCode >= CODE_UPPER_A && charCode <= CODE_UPPER_Z) ||
        (charCode >= CODE_0 && charCode <= CODE_9);
}

function isNumber(char) {
    var charCode = char.charCodeAt(0);
    return charCode >= CODE_0 && charCode <= CODE_9;
}

Parser.prototype.getToken = function () {
    return this._token;
};

Parser.TOKEN_TEXT = 'text';
Parser.TOKEN_NUMBER = 'number';
Parser.TOKEN_EOF = 'oef';
Parser.TOKEN_UNKNOWN = 'unknown';
Parser.TOKEN_BEGIN_EXPRESSION = 'begin_expression';
Parser.TOKEN_BEGIN_BLOCK_EXPRESSION = 'begin_block_expression';
Parser.TOKEN_END_EXPRESSION = 'end_expression';
Parser.TOKEN_BEGIN_CLOSE_BLOCK_EXPRESSION = 'begin_close_block_expression';
Parser.TOKEN_OPERATOR = 'operator';
Parser.TOKEN_IDENTIFIER = 'identifier';
Parser.TOKEN_STRING = 'string';

module.exports = Parser;
