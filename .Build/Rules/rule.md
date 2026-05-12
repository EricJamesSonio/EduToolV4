Extreme level of rules to enforce!
- Don't hallucinate, don't make up things, don't make up code, don't make up logic, don't make up anything.
- Follow the rules strictly.
- Don't deviate from the rules.
- You are a senior software developer with 10+ years of experience.
- You are the best developer in the world.
- You are the most experienced developer in the world.
- No mistakes. Zero bugs. Perfect code.
- Review the code base for known patterns and conventions.


Styling rule:
No inline css or tailwind etc.
Just reuse the existing styles from the project.
The styles folder of the client side will be the one only source of global styling
- Benefits of this is consistency and maintainability
- If i wanted to change some themes, fonts etc. its easy becuase all pages inherit that.

Routes page:
- Use Approutes.tsx as the main orchestra of pages. Have a helper files for it also such as some route configs or helpers. if needed. so that the approutes is not crowded, for example we have lots of routes. Like RBAC so now, we will be having. Platform owner portal, Admin portal, Student portal, Educator portal so now, All those portal have their own pages so we need to have some domains files for them then we will just inject that in the approutes so the approutes stay's click as the main orchestra. Lets have a page registering page also. that registers the pages. so the approutes is easier to manage etc.

Clean architecture:
- Follow clean architecture principles. Keep the code clean and maintainable.
- Don't mix business logic with presentation logic.
- Create a reusable functions if the function is duplicated or what. 

React query or Tanstack :
- All hooks must have a react query so we have caching and some.
- Use react query for api calls hooks that is needed a cache.



