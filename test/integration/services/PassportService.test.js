'use strict'
/* global describe, it */

const assert = require('assert')
const supertest = require('supertest')

describe('PassportService', () => {
  let request, agent, token, user
  before((done) => {
    request = supertest('http://localhost:3000')
    agent = supertest.agent(global.app.packs.express.server)

    request
      .post('/auth/local/register')
      .set('Accept', 'application/json') //set header for this test
      .send({username: 'jaumard', password: 'adminadmin', email: 'test@test.te'})
      .expect(200)
      .end((err, res) => {
        // console.log('THIS USER',res.body)
        assert.equal(res.body.redirect, '/')
        assert.notEqual(res.body.user.id, null)
        assert.ok(res.body.user.onUserLogin)
        user = res.body.user
        token = res.body.token
        done(err)
      })
  })
  it('should exist', () => {
    assert(global.app.api.services['PassportService'])
    assert(global.app.services['PassportService'])
  })

  it('should insert a user on /auth/local/register', (done) => {
    agent
      .post('/auth/local/register')
      .set('Accept', 'application/json') //set header for this test
      .send({username: 'jim', password: 'adminadmin'})
      .expect(200)
      .end((err, res) => {
        assert.equal(res.body.redirect, '/')
        assert.notEqual(res.body.user.id,null)
        assert.equal(res.body.user.username, 'jim')
        assert.ok(res.body.user.onUserLogin)
        done(err)
      })
  })
  it('should logout logged in user', (done) => {
    agent
      .post('/auth/logout')
      .set('Accept', 'application/json') //set header for this test
      .send({})
      .expect(200)
      .end((err, res) => {
        // assert.equal(res.body.redirect, '/')
        // assert.notEqual(res.body.user.id,null)
        // assert.equal(res.body.user.username, 'jim')
        // assert.ok(res.body.user.onUserLogin)
        done(err)
      })
  })

  it('should insert a user on /auth/local/register and redirect to new value', (done) => {
    request
      .post('/auth/local/register')
      .set('Accept', 'application/json') //set header for this test
      .send({username: 'scott', password: 'adminadmin', redirect: '/hello'})
      .expect(200)
      .end((err, res) => {
        assert.equal(res.body.redirect, '/hello')
        assert.notEqual(res.body.user.id, null)
        assert.equal(res.body.user.username, 'scott')
        assert.ok(res.body.user.onUserLogin)
        done(err)
      })
  })

  it('should return an error on missing passport for registration on /auth/local/register', (done) => {
    request
      .post('/auth/local/register')
      .set('Accept', 'application/json') //set header for this test
      .send({username: 'yoyo'})
      .expect(400)
      .end((err, res) => {
        done(err)
      })
  })

  it('should insert a user on /auth/local/register with form submit', (done) => {
    request
      .post('/auth/local/register')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('username=jim2&password=adminadmin2')
      .set('Accept', 'application/json') //set header for this test
      .expect(200)
      .end((err, res) => {
        assert.equal(res.body.redirect, '/')
        assert.notEqual(res.body.user.id,null)
        assert.equal(res.body.user.username, 'jim2')
        done(err)
      })
  })


  it('should log a user on /auth/local', (done) => {
    request
      .post('/auth/local')
      .set('Accept', 'application/json') //set header for this test
      .send({email: 'test@test.te', password: 'adminadmin'})
      .expect(200)
      .end((err, res) => {
        // console.log(res.body)
        assert.equal(res.body.redirect, '/')
        assert.notEqual(res.body.user.id,null)
        assert.equal(res.body.user.username, 'jaumard')
        assert(res.body.token)//JWT token
        assert.ok(res.body.user.onUserLogin)
        done(err)
      })
  })

  it('should log a user on /auth/local with form submit', (done) => {
    request
      .post('/auth/local')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('username=jim2&password=adminadmin2')
      .set('Accept', 'application/json') //set header for this test
      .expect(200)
      .end((err, res) => {
        assert.equal(res.body.redirect, '/')
        assert.notEqual(res.body.user.id,null)
        assert.equal(res.body.user.username, 'jim2')
        assert(res.body.token)//JWT token
        assert.ok(res.body.user.onUserLogin)
        done(err)
      })
  })
  it('should retrieve data on / with JWT token', (done) => {
    request
      .get('/')
      .set('Authorization', `JWT ${token}`)
      .set('Accept', 'application/json') //set header for this test
      .expect(200)
      .end((err, res) => {
        assert.equal(res.text, 'ok')
        done(err)
      })
  })

  it('should be able to update password', (done) => {
    // Hackfix for trailpack-mongoose, we should update trailpack-mongoose FootprintService.find for avoiding this
    const criteria = (user._id) ? {_id: user.id} : {id: user.id} //eslint-disable-line

    global.app.services.FootprintService.find('user', criteria, {populate: 'passports'})
      .then(user => {
        global.app.services.PassportService.updateLocalPassword(user[0], 'testtest')
          .then(() => {
            done()
          })
          .catch(done)
      })
      .catch(done)
  })
})
