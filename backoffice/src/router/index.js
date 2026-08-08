import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/Login.vue";
import Listings from "@/views/Listings.vue";
import ListingForm from "@/views/ListingForm.vue";
import Settings from "@/views/Settings.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { guest: true },
  },
  {
    path: "/",
    name: "Listings",
    component: Listings,
    meta: { requiresAuth: true },
  },
  {
    path: "/listings/new",
    name: "ListingCreate",
    component: ListingForm,
    meta: { requiresAuth: true },
  },
  {
    path: "/listings/:id",
    name: "ListingEdit",
    component: ListingForm,
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    return { name: "Login" };
  }
  if (to.meta.guest && token) {
    return { name: "Listings" };
  }
  return true;
});

export default router;
