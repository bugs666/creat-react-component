import del from "rollup-plugin-delete";
import resolve from "@rollup/plugin-node-resolve";
import jsonResolve from "@rollup/plugin-json";
import copy from 'rollup-plugin-copy'


export default {
    input: './index.js',
    output: {
        file: 'dist/index.js',
        format: "cjs",
        name: 'rcc'
    },
    external: [
        "rollup",
        "rollup-plugin-commonjs",
        "rollup-plugin-typescript2",
        "rollup-plugin-node-resolve",
        "rollup-plugin-delete"
    ],
    plugins: [
        del({targets: "dist/*"}),
        resolve(),
        jsonResolve(),
        copy({
            targets: [
                {src: 'templates', dest: 'dist'}
            ]
        })
    ]
};
