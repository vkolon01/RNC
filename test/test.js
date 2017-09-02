var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var request = require('supertest');

describe('Integrated Testing:',function(){
    const OK = 200,
       BAD_REQUEST = 400,
       NOT_FOUND = 404,
       INTERNAL_SERVER_ERROR = 500;
    var server = require('../server');
    describe('Routing',function(){
        describe('/roman',function(){
            after(function(){
                server.close();
            });
            it('non existent url should return NOT_FOUND', function(done){
                request(server)
                    .get('/BAD_URL')
                    .expect(NOT_FOUND,done);
            });
            it('/10 should return OK',function(done){
                request(server)
                    .get('/roman/10')
                    .expect(OK,done);
            });
            it('/:negative_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/roman/-10')
                    .expect(BAD_REQUEST,done);
            });
            it('/:too_large_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/roman/5000')
                    .expect(BAD_REQUEST,done);
            });
            it('/not_a_number should return BAD_REQUEST',function (done){
                request(server)
                    .get('/roman/not_a_number')
                    .expect(BAD_REQUEST,done)
            });
            it('/type_double should return BAD_REQUEST',function(done) {
                request(server)
                    .get('/roman/10.5')
                    .expect(BAD_REQUEST, done);
            });
        });
        describe('/arabic',function(){
            after(function(){
                server.close();
            });
            it('/UpperCase and lowerCase should return OK',function(done){
                request(server)
                    .get('/arabic/mIx')
                    .expect(OK,done);
            });
            it('/:too_large_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/arabic/5000')
                    .expect(BAD_REQUEST,done);
            });
            it('/including_bad_character should return BAD_REQUEST',function (done){
                request(server)
                    .get('/arabic/IXW')
                    .expect(BAD_REQUEST,done)
            });
            it('/IXI should return BAD_REQUEST',function(done){
                request(server)
                    .get('/arabic/IXI')
                    .expect(BAD_REQUEST,done)
            });
        });
        describe('/all',function(){
            before(function(){
                request(server)
                    .get('/roman/1462')
            });
            after(function(){
                server.close();
            });
            it('/should contain conversion of 10',function(done){
                request(server)
                    .get('/all/arabic')
                    .then(function(res){
                        expect(res.body).to.include('10');
                        done();
                    })

            });
        })
    });
});