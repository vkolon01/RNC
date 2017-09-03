var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var request = require('supertest');
var app = require('../app');

describe('Integrated Testing:',function(){
    const OK = 200,
       BAD_REQUEST = 400,
       NOT_FOUND = 404,
       INTERNAL_SERVER_ERROR = 500;

    var arabicTestingValues = {
        tooLarge : [5000, BAD_REQUEST],
        negative : [-10, BAD_REQUEST],
        double : [10.3,BAD_REQUEST],
        zero : [0, BAD_REQUEST],
        ok : [30, OK],
        NaN : ['RANDY', BAD_REQUEST]
    };
    var romanTestingValues = {
        tooLarge : ['MMMMM', BAD_REQUEST],
        badCharacter : ['CXA', BAD_REQUEST],
        upper_and_lowercase : ['xiI',OK],
        zero : [0, BAD_REQUEST],
        ok : [30, OK],
        NaN : ['RANDY', BAD_REQUEST],
        illegalNumberStructure : ['IXI', BAD_REQUEST]
    };

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
            it('/between_1_and_4999 should return OK',function(done){
                request(server)
                    .get('/roman/' + arabicTestingValues.ok[0])
                    .expect(arabicTestingValues.ok[1],done);
            });
            it('/:negative_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/roman/' + arabicTestingValues.negative[0])
                    .expect(arabicTestingValues.negative[1],done);
            });
            it('/:too_large_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/roman/' + arabicTestingValues.tooLarge[0])
                    .expect(arabicTestingValues.tooLarge[1],done);
            });
            it('/not_a_number should return BAD_REQUEST',function (done){
                request(server)
                    .get('/roman/' + arabicTestingValues.NaN[0])
                    .expect(arabicTestingValues.NaN[1],done)
            });
            it('/type_double should return BAD_REQUEST',function(done) {
                request(server)
                    .get('/roman/' + arabicTestingValues.double[0])
                    .expect(arabicTestingValues.NaN[1], done);
            });
        });
        describe('/arabic',function(){
            after(function(){
                server.close();
            });
            it('/UpperCase and lowerCase should return OK',function(done){
                request(server)
                    .get('/arabic/' + romanTestingValues.tooLarge[0])
                    .expect(romanTestingValues.tooLarge[1],done);
            });
            it('/:too_large_number should return BAD_REQUEST',function(done){
                request(server)
                    .get('/arabic/' + romanTestingValues.tooLarge[0])
                    .expect(romanTestingValues.tooLarge[1],done);
            });
            it('/including_bad_character should return BAD_REQUEST',function (done){
                request(server)
                    .get('/arabic/' + romanTestingValues.badCharacter[0])
                    .expect(romanTestingValues.badCharacter[1],done)
            });
            it('/illegal structure should return BAD_REQUEST',function(done){
                request(server)
                    .get('/arabic/' + romanTestingValues.illegalNumberStructure[0])
                    .expect(romanTestingValues.illegalNumberStructure[1],done)
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
        });
        describe('/remove/all',function(){
            it('should return OK',function(done){
                request(server)
                    .delete('/remove/all')
                    .expect(OK,done)
            })
        });
    });
});