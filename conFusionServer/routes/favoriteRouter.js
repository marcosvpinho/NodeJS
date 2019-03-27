const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');
const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.get(cors.cors,authenticate.verifyUser,(req,res,next) => {
    Favorites.find({"user": req.user._id})
    .populate('dishes')
    .populate('user')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({"user": req.user._id}, (err, favorites) => {
        if(!favorites){
            Favorites.create(req.body, (err,favorites) =>{
                if(err){
                    err = new Error('Cant create favorite');
                    err.statusCode = 404;
                    return next(err);
                }else{
                    favorites.user = req.user._id;
                    console.log('favorite created');
                    favorites.dishes.push(req.body._id);
                    favorites.save((err,favorites)=>{
                        if(err){
                            err = new Error('Cant create favorite');
                            err.statusCode = 404;
                            return next(err);
                        }
                        res.statusCode = 200;
                        res.json(favorites);

                    })
                }
            })
        }else{
            var exist = favorites.dishes.indexOf(req.body._id);
            if(exist > -1){
                err = new Error('The dish is alredy in the favorite list');
                err.statusCode = 401;
                return next(err);
            }else{
                favorites.dishes.push(req.body._id);
                favorites.save((err,favorites) =>{
                    if(err){
                        err = new Error('Cant add the dish');
                        err.statusCode = 401;
                        return next(err);
                    }else{
                        console.log('Dish added to the favorite list');
                        res.json(favorites);
                    }
                });

            }

        }
        });
})
.delete(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.remove({"user":req.user._id},(err,resp) =>{
        if(err){
            err = new Error('Cant delete the dishes');
            err.statusCode = 401;
            return next(err);
        }else{
            console.log('All dishes deleted from your list');
            res.json(resp);
        }
    });
});


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res)=> {
    res.sendStatusCode(200);
})
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({"user": req.user._id}, (err, favorites) => {
        if(!favorites){
            Favorites.create(req.body, (err,favorites) =>{
                if(err){
                    err = new Error('Cant create favorite');
                    err.statusCode = 404;
                    return next(err);
                }else{
                    favorites.user = req.user._id;
                    console.log('favorite created');
                    favorites.dishes.push(req.params.dishId);
                    favorites.save((err,favorites)=>{
                        if(err){
                            err = new Error('Cant create favorite');
                            err.statusCode = 404;
                            return next(err);
                        }
                        res.statusCode = 200;
                        res.json(favorites);

                    })
                }
            })
        }else{
            var exist = favorites.dishes.indexOf(req.params.dishId);
            if(exist > -1){
                err = new Error('The dish is alredy in the favorite list');
                err.statusCode = 401;
                return next(err);
            }else{
                favorites.dishes.push(req.params.dishId);
                favorites.save((err,favorites) =>{
                    if(err){
                        err = new Error('Cant add the dish');
                        err.statusCode = 401;
                        return next(err);
                    }else{
                        console.log('Dish added to the favorite list');
                        res.json(favorites);
                    }
                });
            }
        }
        });
})

.delete(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({"user": req.user._id})
    .then((favorites)=>{
        if(favorites){
            var index = favorites.dishes.indexOf(req.params.dishId)
            if(index > -1){
                favorites.dishes.splice(index,1);
            }
            favorites.save()
            .then((favorites) =>{
                Favorites.find({"user": req.user._id})
                .populate('dishes')
                .populate('user')
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }, (err) => next(err));
                });
        }else{
            err = new Error('Cant delete the dish');
            err.statusCode = 401;
            return next(err);
        }   
    });
});

module.exports = favoriteRouter;