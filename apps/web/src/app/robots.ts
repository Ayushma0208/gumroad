import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/library",
          "/library/",
          "/orders",
          "/orders/",
          "/notifications",
          "/api/",
        ],
      },
    ],
  };
}
