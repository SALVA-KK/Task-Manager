from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase


class AuthTests(APITestCase):
    creds = {"email": "a@x.com", "password": "S3cure-pass!"}

    def test_signup_returns_token(self):
        r = self.client.post("/api/auth/signup/", self.creds)
        self.assertEqual(r.status_code, 201)
        self.assertIn("token", r.data)

    def test_duplicate_signup_rejected(self):
        self.client.post("/api/auth/signup/", self.creds)
        r = self.client.post("/api/auth/signup/", self.creds)
        self.assertEqual(r.status_code, 400)

    def test_short_password_rejected(self):
        r = self.client.post("/api/auth/signup/", {"email": "a@x.com", "password": "short"})
        self.assertEqual(r.status_code, 400)

    def test_login_success(self):
        self.client.post("/api/auth/signup/", self.creds)
        r = self.client.post("/api/auth/login/", self.creds)
        self.assertEqual(r.status_code, 200)
        self.assertIn("token", r.data)

    def test_login_wrong_password_is_401(self):
        self.client.post("/api/auth/signup/", self.creds)
        r = self.client.post("/api/auth/login/", {**self.creds, "password": "wrong"})
        self.assertEqual(r.status_code, 401)

    def test_logout_invalidates_token(self):
        token = self.client.post("/api/auth/signup/", self.creds).data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        # the same token must no longer work
        self.assertEqual(self.client.get("/api/tasks/").status_code, 401)