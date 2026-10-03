from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Task

User = get_user_model()


class TaskAPITests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice@x.com", "alice@x.com", "pw12345678")
        self.bob = User.objects.create_user("bob@x.com", "bob@x.com", "pw12345678")
        self.login(self.alice)

    def login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_requires_authentication(self):
        self.client.credentials()  # remove the token
        self.assertEqual(self.client.get("/api/tasks/").status_code, 401)

    def test_create_task(self):
        r = self.client.post("/api/tasks/", {"title": "Ship it"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Task.objects.get().owner, self.alice)

    def test_blank_title_rejected(self):
        r = self.client.post("/api/tasks/", {"title": "   "})
        self.assertEqual(r.status_code, 400)

    def test_user_sees_only_own_tasks(self):
        Task.objects.create(owner=self.alice, title="mine")
        Task.objects.create(owner=self.bob, title="theirs")
        r = self.client.get("/api/tasks/")
        self.assertEqual([t["title"] for t in r.data], ["mine"])

    def test_other_users_task_returns_404(self):
        task = Task.objects.create(owner=self.bob, title="theirs")
        url = f"/api/tasks/{task.id}/"
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.patch(url, {"title": "x"}).status_code, 404)
        self.assertEqual(self.client.delete(url).status_code, 404)
        self.assertTrue(Task.objects.filter(id=task.id).exists())

    def test_filter_by_status(self):
        Task.objects.create(owner=self.alice, title="a", status="todo")
        Task.objects.create(owner=self.alice, title="b", status="done")
        r = self.client.get("/api/tasks/?status=done")
        self.assertEqual([t["title"] for t in r.data], ["b"])

    def test_search_by_title(self):
        Task.objects.create(owner=self.alice, title="Write report")
        Task.objects.create(owner=self.alice, title="Buy milk")
        r = self.client.get("/api/tasks/?search=report")
        self.assertEqual([t["title"] for t in r.data], ["Write report"])

    def test_update_status_and_delete(self):
        task = Task.objects.create(owner=self.alice, title="x")
        r = self.client.patch(f"/api/tasks/{task.id}/", {"status": "done"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "done")
        self.assertEqual(self.client.delete(f"/api/tasks/{task.id}/").status_code, 204)