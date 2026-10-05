import { createDb } from './db.js';
import { createApp } from './app.js';
import express from 'express';
import path from 'node:path';
const app=createApp(createDb());
if(process.env.NODE_ENV==='production'){app.use(express.static('dist'));app.get('/{*path}',(req,res)=>res.sendFile(path.resolve('dist/index.html')));}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true,hmr:{port:Number(process.env.PORT||3000)+21678}},appType:'spa'});app.use(vite.middlewares);}
const port=Number(process.env.PORT)||3000;app.listen(port,'0.0.0.0',()=>console.log('FixIt ready on port '+port));
