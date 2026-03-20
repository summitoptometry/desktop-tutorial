import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
// 只在需要构建 Electron 时才使用这个插件
// import electron from 'vite-plugin-electron'
import path from 'path'
import postcssPxToViewPort from "postcss-px-to-viewport";


export default defineConfig({
    base: './', // 使用相对路径，支持部署到子目录（v1/v2）
    plugins: [
        vue(),
        // 移除 electron 插件配置
    ],
    server: {
        port: 5175,
        host: '0.0.0.0',
        strictPort: false, // 如果5173被占用，自动尝试下一个端口
        proxy: {
            '/api': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                // 不重写路径，保持 /api 前缀
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url);
                    });
                }
            },
            '/organization': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/medicalrecords': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/product': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/brand': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/warehouse': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/subaccount': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            },
            '/patient': {
                target: 'https://aiforoptometry.com',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url, '->', proxyReq.path);
                    });
                }
            }
        }
    },
    css: {
        postcss: {
            plugins: [
                postcssPxToViewPort({
                    viewportWidth: 1920,
                    unitToConvert: 'px',
                    unitPrecision: 5,
                    propList: ['*'],
                    viewportUnit: 'vw',
                    fontViewportUnit: 'vw',
                    selectorBlackList: ['ignore-'],
                    minPixelValue: 1,
                    exclude: [/node_modules/],
                    landscape: false,
                    landscapeUnit: 'vw',
                    mediaQuery: false,
                    replace: true,
                })
            ]
        }
    },
    publicDir: 'public', // 默认值，可以修改为其他路径
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    }
})
