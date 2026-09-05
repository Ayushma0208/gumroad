export function cloudinaryThumb(url: string, width = 640) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_fill,w_${width}/`);
}
