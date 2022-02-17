// https://www.wolframcloud.com/obj/d40/Published/spring%20eom.nb
// https://develop.wolframcloud.com/env/d7c3752d-b6d9-4db1-a4ca-80da5f122d24


sqrt = Math.sqrt
pow = Math.pow
M_E = Math.E
     -(
          pow(M_E,(-c + sqrt(pow(c,2) - 4*k)) *t/2) * c
        + pow(M_E,(-c + sqrt(pow(c,2) - 4*k)) *t/2) * sqrt(pow(c,2) - 4*k)
        - pow(M_E,(-c + sqrt(pow(c,2) - 4*k)) *t/2) * 2*v
        - pow(M_E,(-c - sqrt(pow(c,2) - 4*k)) *t/2) * c
        + pow(M_E,(-c - sqrt(pow(c,2) - 4*k)) *t/2) * sqrt(pow(c,2) - 4*k)
        + pow(M_E,(-c - sqrt(pow(c,2) - 4*k)) *t/2) * 2*v
        -               sqrt(pow(c,2) - 4*k) *2
    ) /                (sqrt(pow(c,2) - 4*k) *2)



// https://en.wikipedia.org/wiki/Trigonometric_functions
// https://en.wikipedia.org/wiki/Hyperbolic_function

cosh(x*i) = cos(x)
sinh(x*i) = sin(x) * i;

cosh(x) - sinh(x) = e**(-x)
cosh(x) + sinh(x) = e**(x)


1 + M_E**(-((c*t)/2)) * (
      -cosh(sqrt(c**2 - 4*k) *t/2)
    - (sinh(sqrt(c**2 - 4*k) *t/2)
          / sqrt(c**2 - 4*k) *(c - 2*v))
    )


#include <math.h>
// double pow(double(base), double(power));
// double sqrt(double arg);
// M_E
// https://www.lemoda.net/c/maths-constants/

