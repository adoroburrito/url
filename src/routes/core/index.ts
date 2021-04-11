import express from "express";
import { slugController } from "../../controllers/slugController"

const handleResponse = (res: express.Response, response: controllerResponse) => {
  const {code, returnMessage, redirect} = response;
  if(redirect){
    return res.redirect(redirect);
  }
  return res.status(code).send(returnMessage);
}

const coreRouter = express.Router();

coreRouter.get("/", function (_: express.Request, res: express.Response) {
  const code = 200;
  const body = `This is an URL shortener. /POST me with a slug you'd like (url.nog.dev/%slug_here%) with a json like this to create a new shortened link: <pre>{"url": "https://yourcoolurl.com"}</pre>`;
    res.status(code).send(body);
});

coreRouter.get("/:slug", async function (req: express.Request, res: express.Response) {
  const result: controllerResponse = await slugController.getUrl(req.params.slug);
  return handleResponse(res, result);
});

coreRouter.post("/:slug", async function (req: express.Request, res: express.Response) {
  const result: controllerResponse = await slugController.postUrl(req.params.slug, req.body.redirect);
  return handleResponse(res, result);
});

export { coreRouter };
