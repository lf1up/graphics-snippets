import {
    SSAORenderMaterial,
    SSAOBlurMaterial
} from './ssaoMaterialsAndShaders';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export interface SSAOParameters {
    enabled: boolean;
    alwaysUpdate: boolean;
    kernelRadius: number;
    depthBias: number;
    maxDistance: number;
    maxDepth: number;
    intensity: number;
    fadeout: number
}

export class SSAORenderTargets {
    public ssaoParameters: SSAOParameters;
    private width: number;
    private height: number;
    private samples: number;
    private ssaoTargetSamples: number = 0;
    private depthNormalScale = 1;
    private _noiseTexture?: THREE.DataTexture;
    private _kernel: THREE.Vector3[] = [];
    private _normalRenderMaterial?: THREE.MeshNormalMaterial;
    private _ssaoRenderMaterial?: SSAORenderMaterial;
    private _blurRenderMaterial?: SSAOBlurMaterial;
    private _depthNormalRenderTarget?: THREE.WebGLRenderTarget;
    private _ssaoRenderTarget?: THREE.WebGLRenderTarget;
    private _blurRenderTarget?: THREE.WebGLRenderTarget;

    public get depthNormalRenderTarget(): THREE.WebGLRenderTarget {
        if (!this._depthNormalRenderTarget) {
            const depthTexture = new THREE.DepthTexture(this.width * this.depthNormalScale, this.height * this.depthNormalScale);
            depthTexture.format = THREE.DepthStencilFormat;
            depthTexture.type = THREE.UnsignedInt248Type;
            this._depthNormalRenderTarget = new THREE.WebGLRenderTarget(this.width * this.depthNormalScale, this.height * this.depthNormalScale, {
                minFilter: SSAOBlurMaterial.optimized || this.depthNormalScale !== 1.0 ? THREE.LinearFilter : THREE.NearestFilter,
                magFilter: SSAOBlurMaterial.optimized || this.depthNormalScale !== 1.0 ? THREE.LinearFilter : THREE.NearestFilter,
                depthTexture
            });
        }
        return this._depthNormalRenderTarget;
    }

    public get ssaoRenderTarget(): THREE.WebGLRenderTarget {
        this._ssaoRenderTarget ??= new THREE.WebGLRenderTarget(this.width, this.height, { samples: this.ssaoTargetSamples });
        return this._ssaoRenderTarget;
    }

    public get blurRenderTarget(): THREE.WebGLRenderTarget {
        this._blurRenderTarget ??= new THREE.WebGLRenderTarget(this.width, this.height, { samples: this.ssaoTargetSamples });
        return this._blurRenderTarget;
    }

    public get normalRenderMaterial(): THREE.MeshNormalMaterial {
        this._normalRenderMaterial ??= new THREE.MeshNormalMaterial({blending: THREE.NoBlending})
        return this._normalRenderMaterial;
    }

    public get ssaoRenderMaterial(): SSAORenderMaterial {
        this._ssaoRenderMaterial ??= new SSAORenderMaterial({
            normalTexture: this.depthNormalRenderTarget.texture,
            depthTexture: this.depthNormalRenderTarget.depthTexture,
            noiseTexture: this.noiseTexture,
            kernel: this.kernel,
        });
        return this._ssaoRenderMaterial.update({ width: this.width, height: this.height });
    }

    public get blurRenderMaterial(): SSAOBlurMaterial {
        this._blurRenderMaterial ??= new SSAOBlurMaterial();
        return this._blurRenderMaterial?.update({width: this.width, height: this.height, texture: this.ssaoRenderTarget.texture});
    }

    private get noiseTexture(): THREE.DataTexture {
        this._noiseTexture ??= this.generateRandomKernelRotations();
        return this._noiseTexture;
    }

    private get kernel(): THREE.Vector3[] {
        if (!this._kernel.length) {
            this._kernel = this.generateSampleKernel();
        }
        return this._kernel;
    }

    constructor(width: number, height: number, samples: number, parameters?: any) {
        this.ssaoParameters = {
            enabled: parameters?.enabled ?? true,
            alwaysUpdate: parameters?.alwaysUpdate ?? true,
            kernelRadius: parameters?.kernelRadius ?? 0.03,
            depthBias: parameters?.depthBias ?? 0.005,
            maxDistance: parameters?.maxDistance ?? 0.5,
            maxDepth: parameters?.maxDepth ?? 0.99,
            intensity: parameters?.intensity ?? 1,
            fadeout: parameters?.fadeout ?? 1,
        };
        this.width = width;
        this.height = height;
        this.samples = samples;
    }

    public dispose() {
        this._noiseTexture?.dispose();
        this._normalRenderMaterial?.dispose();
        this._ssaoRenderMaterial?.dispose();
        this._blurRenderMaterial?.dispose();
        this._depthNormalRenderTarget?.dispose();
        this._ssaoRenderTarget?.dispose();
        this._blurRenderTarget?.dispose();
    }

    public setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._ssaoRenderMaterial?.update({width: this.width, height: this.height});
        this._blurRenderMaterial?.update({width: this.width, height: this.height});
        this._depthNormalRenderTarget?.setSize(this.width * this.depthNormalScale, this.height * this.depthNormalScale);
        this._ssaoRenderTarget?.setSize(this.width, this.height);
        this._blurRenderTarget?.setSize(this.width, this.height);
    }

    public updateSSAOMaterial(camera: THREE.Camera): THREE.ShaderMaterial {
        return this.ssaoRenderMaterial.update({camera}).update(this.ssaoParameters);
    }

    public updateSSAOKernel() {
        if (this._noiseTexture) {
            this._noiseTexture = this.generateRandomKernelRotations();
        }
        if (this._kernel) {
            this._kernel = this.generateSampleKernel();
        }
        if (this._ssaoRenderMaterial) {
            this._ssaoRenderMaterial.uniforms.tNoise.value = this._noiseTexture;
            this._ssaoRenderMaterial.uniforms.kernel.value = this._kernel;
        }
    }

    private generateSampleKernel(): THREE.Vector3[] {
        const kernelSize = SSAORenderMaterial.kernelSize;
        const kernel: THREE.Vector3[] = [];
        for (let i = 0; i < kernelSize; i ++) {
            const sample = new THREE.Vector3();
            sample.x = ( Math.random() * 2 ) - 1;
            sample.y = ( Math.random() * 2 ) - 1;
            sample.z = Math.random();
            sample.normalize();
            let scale = i / kernelSize;
            scale = THREE.MathUtils.lerp(0.1, 1, scale * scale);
            sample.multiplyScalar(scale);
            kernel.push(sample);
        }
        return kernel;
    }

    private generateRandomKernelRotations(): THREE.DataTexture  {
        const width = 4;
        const height = 4;
        if (SimplexNoise === undefined ) {
            console.error( 'SSSO MSAA Pass: The pass relies on SimplexNoise.' );
        }
        const simplex = new SimplexNoise();
        const size = width * height;
        const data = new Float32Array( size );
        for ( let i = 0; i < size; i ++ ) {
            const x = ( Math.random() * 2 ) - 1;
            const y = ( Math.random() * 2 ) - 1;
            const z = 0;
            data[ i ] = simplex.noise3d( x, y, z );
        }
        const noiseTexture = new THREE.DataTexture(data, width, height, THREE.RedFormat, THREE.FloatType);
        noiseTexture.wrapS = THREE.RepeatWrapping;
        noiseTexture.wrapT = THREE.RepeatWrapping;
        noiseTexture.needsUpdate = true;
        return noiseTexture;
    }
}
