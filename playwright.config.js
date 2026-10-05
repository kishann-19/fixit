import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',use:{baseURL:'http://localhost:3101',viewport:{width:1440,height:1080}},webServer:{command:'PORT=3101 DB_PATH=:memory: node server/index.js',url:'http://localhost:3101',reuseExistingServer:false},reporter:'list'});
