[![StackOverflow](https://stackexchange.com/users/flair/7322082.png)](https://stackoverflow.com/users/5577765/rabbid76?tab=profile)

---

<!-- TOC -->

- [Lambertian reflectance model](#lambertian-reflectance-model)
    - [How it works](#how-it-works)

<!-- /TOC -->

# Lambertian reflectance model

To model the reflection of light in computer graphics is used a Bidirectional reflectance distribution function (BRDF).
BRDF is a function that gives the relation between the light reflected along an outgoing direction and the light incident from an incoming direction. 

A perfect diffuse surface has a BRDF that has the same value for all incident and outgoing directions. This substantially reduces the computations and thus it is commonly used to model diffuse surfaces as it is physically plausible, even though there are no pure diffuse materials in the real world.  This BRDF is called Lambertian reflection because it obeys Lambert's cosine law. 

Lambertian reflection is often used as a model for diffuse reflection. This technique causes all closed polygons (such as a triangle within a 3D mesh) to reflect light equally in all directions when rendered. The diffusion coefficient is calculated from the angle between the normal vector and the light vector.

```txt
f_Lambertian = max( 0.0, dot( N, L ) )
```

where `N` is the normal vector of the surface, and `L` is the vector towards to the light source.  

## How it works 

In general The *dot* product of 2 vectors is equal the *cosine* of the angle between the 2 vectors multiplied by the magnitude (lenght) of both vectors. 

```txt
dot( A, B ) == length( A ) * length( B ) * cos( angle_A_B ) 
```

This follows, that the *dot* product of 2 unit vectors is equal the *cosine* of the angle between the 2 vectors, because the length of a unit vector is 1.

```txt
uA = normalize( A )
uB = normalize( B )
cos( angle_A_B ) == dot( uA, uB )
```

![dot A, B](image/dotAB.svg)    

If we take a look at the *cos(x)* function between the angles -90 degrees and 90 degrees then we can see that it has a maximum of 1 at an angle of 0 degrees and It goes down to 0 at the angles of 90 degrees and -90 degrees.

![cos(x) in [-90, 90]](image/cos_-90_90.png)

This behavior is exactly that what we want for the reflection model. When the nromal vetor of the surface and the diretion to the light source are in the same direction (the angle between is 0 degrees) then we want a maximium of reflection.
In contrast, if the vectors a orthonormalized (the angle in between is 90 degrees) then we want a minimum of reflection and we want a smooth and continuous functional running between the two borders of 0 degrees and 90 degrees.

![N dot L](image/NdotL.png)

If the light model is calculated in the vertex shader, the reflection is calculated for each corner of the primitive. In between the primitives the reflections are interpolate according to its barycentric coordinates.
See the resulting reflections on a spherical surface:

![lambertian sphere](image/lambertian_sphere.png)

See also:

- [How does the calculation of the light model work in a shader program?](https://stackoverflow.com/questions/7061745/how-does-the-calculation-of-the-light-model-work-in-a-shader-program/45121641#45121641)
- [GLSL fixed function fragment program replacement](https://stackoverflow.com/questions/8421778/glsl-fixed-function-fragment-program-replacement/45716107#45716107)

<br/><hr/>

<a href="https://stackexchange.com/users/7322082/rabbid76"><img src="https://stackexchange.com/users/flair/7322082.png" width="208" height="58" alt="profile for Rabbid76 on Stack Exchange, a network of free, community-driven Q&amp;A sites" title="profile for Rabbid76 on Stack Exchange, a network of free, community-driven Q&amp;A sites" /></a>
