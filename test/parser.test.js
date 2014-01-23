require('chai').should();
var Parser = require('../lib/parser');

describe('Parser', function () {
    it('should parse text', function () {
        var parser = new Parser('Hello World');
        parser.getToken().type.should.equal(Parser.TOKEN_TEXT);
        parser.getToken().value.should.equal('Hello World');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse variable', function () {
        var parser = new Parser('{{variableName_1}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('variableName_1');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse mixed variable and text', function () {
        var parser = new Parser('Hello, {{variableName_1}}!');
        parser.getToken().type.should.equal(Parser.TOKEN_TEXT);
        parser.getToken().value.should.equal('Hello, ');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('variableName_1');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_TEXT);
        parser.getToken().value.should.equal('!');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse block', function () {
        var parser = new Parser('{{#if}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_BLOCK_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('if');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse block close', function () {
        var parser = new Parser('{{/if}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_CLOSE_BLOCK_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('if');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse expression with parameters', function () {
        var parser = new Parser('{{exec var1 "Hello" param1=var2 param2="World!"}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('exec');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('var1');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_STRING);
        parser.getToken().value.should.equal('Hello');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('param1');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_OPERATOR);
        parser.getToken().value.should.equal('=');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('var2');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_IDENTIFIER);
        parser.getToken().value.should.equal('param2');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_OPERATOR);
        parser.getToken().value.should.equal('=');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_STRING);
        parser.getToken().value.should.equal('World!');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should parse string value', function () {
        var parser = new Parser('{{"Hello"}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_STRING);
        parser.getToken().value.should.equal('Hello');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
    it('should escape string value', function () {
        var parser = new Parser('{{"Hello \\"mate\\""}}');
        parser.getToken().type.should.equal(Parser.TOKEN_BEGIN_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_STRING);
        parser.getToken().value.should.equal('Hello "mate"');
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_END_EXPRESSION);
        parser.next();
        parser.getToken().type.should.equal(Parser.TOKEN_EOF);
    });
});
