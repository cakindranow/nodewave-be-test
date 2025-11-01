import { response_not_found, response_success } from "$utils/response.utils";
import { Request, Response, Router } from "express";
import { AuthController } from "$controllers/rest/AuthController";
import { authJWT } from "$middlewares/authMiddleware";
import multer from "multer";
import { ProductController } from "$controllers/rest/ProductController";


const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/", (req: Request, res: Response) => {
  return response_success(res, "main routes!");
})


router.get("/example", AuthController.test)
router.get("/example/authenticated", authJWT ,AuthController.test)
router.post("/login", AuthController.login)
router.post("/products/upload", authJWT ,upload.single("file"), ProductController.uploadExcel);
router.get("/products", authJWT, ProductController.getProducts);
router.get("/file-uploads", authJWT, ProductController.getFileUploads);
router.get("/file-uploads/:requestID", authJWT, ProductController.getFileUploadByRequestID);


router.all("*", (req: Request, res: Response) => {
  return response_not_found(res);
});

export default router;
