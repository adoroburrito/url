import DBSingleton from "../db";
import { URL } from "url";
const db = DBSingleton.getInstance();

export const slugController = {
  getUrl: async function (slug: string): Promise<controllerResponse> {
    // url exists?
    const result = await db.select("urls", { slug });

    if(!result){
      return {
        code: 500,
        returnMessage: "Failed to retrieve redirect. Please try again later."
      };
    }

    if (result.rows.length === 0) {
      return {
        code: 404,
        returnMessage: "Slug not found. This redirect may have been excluded or expired."
      };
    }

    return {
      code: 200,
      redirect: result.rows[0].redirect,
    };
  },
  postUrl: async function(slug: string, redirect: string){
    //is redirect valid url?
    try{
      new URL(redirect);
    }catch(error){
      return {
        code: 400,
        returnMessage: "Redirect URL not valid."
      }
    }

    //does this slug already exists?
    const result = await db.select("urls", { slug });

    if(!result){
      return {
        code: 500,
        returnMessage: "Failed to insert redirect. Please try again later."
      };
    }

    if (result.rows.length !== 0) {
      return {
        code: 409,
        returnMessage: "There is already a redirect with that slug. Please try another one."
      };
    }

    //slug doesnt exists, create one and tell the user
    const insertResult = await db.insert("urls", {slug, redirect, active: 1});
    if(!insertResult){
      return {
        code: 500,
        returnMessage: "Failed to insert redirect. Please try again later."
      };
    }

    return {
      code: 201,
      returnMessage: "Slug created."
    };
  }
};
