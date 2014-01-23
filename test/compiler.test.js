require('chai').should();
var Compiler = require('../lib/compiler');
var AstBuilder = require('../lib/ast-builder');
var Parser = require('../lib/parser');

describe('Compiler', function () {
    it('should process string', function () {
        (new Compiler()).compile((new AstBuilder()).build(new Parser('Hello World')))
            .should.equal('function(){return "Hello World";}');
    });
    it('should simplify strings', function () {
        var compiler = new Compiler();
        compiler.setStringResultHandler(JSON.stringify.bind(JSON));
        compiler.compile((new AstBuilder()).build(new Parser('Hello World')))
            .should.equal('"Hello World"');
    });
    it('should process variables', function () {
        (new Compiler()).compile((new AstBuilder()).build(new Parser('{{x}}')))
            .should.equal('function(params){return params.x;}');
    });
    it('should process calls', function () {
        var compiler = new Compiler();
        compiler.registerHelper('tos', function (ast, compiler) {
            return '(\'\'+' + compiler.generateExpression(ast.arguments.list[0]) + ')';
        });
        compiler.compile((new AstBuilder()).build(new Parser('{{tos x}}')))
            .should.equal('function(params){return (\'\'+params.x);}');
    });
    it('should process sections', function () {
        (new Compiler()).compile((new AstBuilder()).build(new Parser('before{{x}}after')))
            .should.equal('function(params){return "before"+params.x+"after";}');
    });
    it('should process blocks', function () {
        var compiler = new Compiler();
        var astBuilder = new AstBuilder();
        astBuilder.registerBlockSection('if', 'else');
        compiler.registerBlockHelper('if', function (ast, compiler) {
            var elseSection = ast.sections[0] && ast.sections[0].name === 'else' ? ast.sections[0] : null;
            return '(' + compiler.generateExpression(ast.arguments.list[0]) +
                '?' + compiler.compileThread(ast.mainSection) +
                ':' + (elseSection ? compiler.compileThread(elseSection) : '""') +
                ')';
        });
        compiler.compile(astBuilder.build(new Parser('{{#if x}}1{{else}}2{{/if}}')))
            .should.equal('function(params){return (params.x?"1":"2");}');
        compiler.compile(astBuilder.build(new Parser('{{#if x}}1{{/if}}')))
            .should.equal('function(params){return (params.x?"1":"");}');
    });
});
