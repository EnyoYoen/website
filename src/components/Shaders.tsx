const planetFrag = `// Terrain generation parameters
uniform int type;
uniform float radius;
uniform float amplitude;
uniform float sharpness;
uniform float offset;
uniform float period;
uniform float persistence;
uniform float lacunarity;
uniform int octaves;

// Layer colors
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform vec3 color5;

// Transition points for each layer
uniform float transition2;
uniform float transition3;
uniform float transition4;
uniform float transition5;

// Amount of blending between each layer
uniform float blend12;
uniform float blend23;
uniform float blend34;
uniform float blend45;

// Bump mapping parameters
uniform float bumpStrength;
uniform float bumpOffset;

// Lighting parameters
uniform float ambientIntensity;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float shininess;
uniform vec3 lightDirection;
uniform vec3 lightColor;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;

void main(){
  // Calculate terrain height
  float h=terrainHeight(
    type,
    fragPosition,
    amplitude,
    sharpness,
    offset,
    period,
    persistence,
    lacunarity,
  octaves);
  
  vec3 dx=bumpOffset*fragTangent;
  float h_dx=terrainHeight(
    type,
    fragPosition+dx,
    amplitude,
    sharpness,
    offset,
    period,
    persistence,
    lacunarity,
  octaves);
  
  vec3 dy=bumpOffset*fragBitangent;
  float h_dy=terrainHeight(
    type,
    fragPosition+dy,
    amplitude,
    sharpness,
    offset,
    period,
    persistence,
    lacunarity,
  octaves);
  
  vec3 pos=fragPosition*(radius+h);
  vec3 pos_dx=(fragPosition+dx)*(radius+h_dx);
  vec3 pos_dy=(fragPosition+dy)*(radius+h_dy);
  
  // Recalculate surface normal post-bump mapping
  vec3 bumpNormal=normalize(cross(pos_dx-pos,pos_dy-pos));
  // Mix original normal and bumped normal to control bump strength
  vec3 N=normalize(mix(fragNormal,bumpNormal,bumpStrength));
  
  // Normalized light direction (points in direction that light travels)
  vec3 L=normalize(-lightDirection);
  // View vector from camera to fragment
  vec3 V=normalize(cameraPosition-pos);
  // Reflected light vector
  vec3 R=normalize(reflect(L,N));
  
  float diffuse=diffuseIntensity*max(0.,dot(N,-L));
  
  // https://ogldev.org/www/tutorial19/tutorial19.html
  float specularFalloff=clamp((transition3-h)/transition3,0.,1.);
  float specular=max(0.,specularFalloff*specularIntensity*pow(dot(V,R),shininess));
  
  float light=ambientIntensity+diffuse+specular;
  
  // Blender colors layer by layer
  vec3 color12=mix(
    color1,
    color2,
    smoothstep(transition2-blend12,transition2+blend12,h));
    
    vec3 color123=mix(
      color12,
      color3,
      smoothstep(transition3-blend23,transition3+blend23,h));
      
      vec3 color1234=mix(
        color123,
        color4,
        smoothstep(transition4-blend34,transition4+blend34,h));
        
        vec3 finalColor=mix(
          color1234,
          color5,
          smoothstep(transition5-blend45,transition5+blend45,h));
          
          gl_FragColor=vec4(light*finalColor*lightColor,1.);
        }`;

const planetVert = `attribute vec3 tangent;

// Terrain generation parameters
uniform int type;
uniform float radius;
uniform float amplitude;
uniform float sharpness;
uniform float offset;
uniform float period;
uniform float persistence;
uniform float lacunarity;
uniform int octaves;

// Bump mapping
uniform float bumpStrength;
uniform float bumpOffset;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;

void main(){
    // Calculate terrain height
    float h=terrainHeight(
        type,
        position,
        amplitude,
        sharpness,
        offset,
        period,
        persistence,
        lacunarity,
    octaves);
    
    vec3 pos=position*(radius+h);
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
    fragPosition=position;
    fragNormal=normal;
    fragTangent=tangent;
    fragBitangent=cross(normal,tangent);
}`;

const noiseShader = `const float PI=3.14159265;

//	Simplex 3D Noise
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.)+1.)*x,289.);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

//
float simplex3(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    
    // First corner
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    
    // Other corners
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    
    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1=x0-i1+1.*C.xxx;
    vec3 x2=x0-i2+2.*C.xxx;
    vec3 x3=x0-1.+3.*C.xxx;
    
    // Permutations
    i=mod(i,289.);
    vec4 p=permute(permute(permute(
                i.z+vec4(0.,i1.z,i2.z,1.))
                +i.y+vec4(0.,i1.y,i2.y,1.))
                +i.x+vec4(0.,i1.x,i2.x,1.));
                
                // Gradients
                // ( N*N points uniformly over a square, mapped onto an octahedron.)
                float n_=1./7.;// N=7
                vec3 ns=n_*D.wyz-D.xzx;
                
                vec4 j=p-49.*floor(p*ns.z*ns.z);//  mod(p,N*N)
                
                vec4 x_=floor(j*ns.z);
                vec4 y_=floor(j-7.*x_);// mod(j,N)
                
                vec4 x=x_*ns.x+ns.yyyy;
                vec4 y=y_*ns.x+ns.yyyy;
                vec4 h=1.-abs(x)-abs(y);
                
                vec4 b0=vec4(x.xy,y.xy);
                vec4 b1=vec4(x.zw,y.zw);
                
                vec4 s0=floor(b0)*2.+1.;
                vec4 s1=floor(b1)*2.+1.;
                vec4 sh=-step(h,vec4(0.));
                
                vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
                vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
                
                vec3 p0=vec3(a0.xy,h.x);
                vec3 p1=vec3(a0.zw,h.y);
                vec3 p2=vec3(a1.xy,h.z);
                vec3 p3=vec3(a1.zw,h.w);
                
                //Normalise gradients
                vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0*=norm.x;
                p1*=norm.y;
                p2*=norm.z;
                p3*=norm.w;
                
                // Mix final noise value
                vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
                m=m*m;
                return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),
                dot(p2,x2),dot(p3,x3)));
            }
            
            float fractal3(
                vec3 v,
                float sharpness,
                float period,
                float persistence,
                float lacunarity,
                int octaves
            ){
                float n=0.;
                float a=1.;// Amplitude for current octave
                float max_amp=0.;// Accumulate max amplitude so we can normalize after
                float P=period;// Period for current octave
                
                for(int i=0;i<octaves;i++){
                    n+=a*simplex3(v/P);
                    a*=persistence;
                    max_amp+=a;
                    P/=lacunarity;
                }
                
                // Normalize noise between [0.0, amplitude]
                return n/max_amp;
            }
            
            float terrainHeight(
                int type,
                vec3 v,
                float amplitude,
                float sharpness,
                float offset,
                float period,
                float persistence,
                float lacunarity,
                int octaves
            ){
                float h=0.;
                
                if(type==1){
                    h=amplitude*simplex3(v/period);
                }else if(type==2){
                    h=amplitude*fractal3(
                        v,
                        sharpness,
                        period,
                        persistence,
                        lacunarity,
                    octaves);
                    h=amplitude*pow(max(0.,(h+1.)/2.),sharpness);
                }else if(type==3){
                    h=fractal3(
                        v,
                        sharpness,
                        period,
                        persistence,
                        lacunarity,
                    octaves);
                    h=amplitude*pow(max(0.,1.-abs(h)),sharpness);
                }
                
                // Multiply by amplitude and adjust offset
                return max(0.,h+offset);
            }`;

export { planetFrag, planetVert, noiseShader };
