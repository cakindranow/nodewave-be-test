import { response_not_found, response_success } from "$utils/response.utils";
import { Request, Response, Router } from "express";
import { AuthController } from "$controllers/rest/AuthController";
import { authJWT } from "$middlewares/authMiddleware";


const router = Router();

router.get("/", (req: Request, res: Response) => {
  return response_success(res, "main routes!");
})

router.post("/login", AuthController.login)

router.get("/example", AuthController.test)
router.get("/auth/example", authJWT ,AuthController.test)


router.all("*", (req: Request, res: Response) => {
  return response_not_found(res);
});

export default router;
