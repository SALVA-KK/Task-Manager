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
        self.assertEqual([t["title"] for t in r.data["results"]], ["mine"])

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
        self.assertEqual([t["title"] for t in r.data["results"]], ["b"])

    def test_search_by_title(self):
        Task.objects.create(owner=self.alice, title="Write report")
        Task.objects.create(owner=self.alice, title="Buy milk")
        r = self.client.get("/api/tasks/?search=report")
        self.assertEqual([t["title"] for t in r.data["results"]], ["Write report"])

    def test_update_status_and_delete(self):
        task = Task.objects.create(owner=self.alice, title="x")
        r = self.client.patch(f"/api/tasks/{task.id}/", {"status": "done"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "done")
        self.assertEqual(self.client.delete(f"/api/tasks/{task.id}/").status_code, 204)

    def test_pagination_12_tasks(self):
        for i in range(12):
            Task.objects.create(owner=self.alice, title=f"Task {i}")
        r1 = self.client.get("/api/tasks/")
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.data["count"], 12)
        self.assertEqual(len(r1.data["results"]), 10)
        r2 = self.client.get("/api/tasks/?page=2")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(len(r2.data["results"]), 2)

    def test_user_sees_only_own_tasks_across_pages(self):
        for i in range(12):
            Task.objects.create(owner=self.alice, title=f"Alice Task {i}")
        for i in range(5):
            Task.objects.create(owner=self.bob, title=f"Bob Task {i}")
        r1 = self.client.get("/api/tasks/")
        self.assertEqual(r1.data["count"], 12)
        self.assertEqual(len(r1.data["results"]), 10)
        r2 = self.client.get("/api/tasks/?page=2")
        self.assertEqual(len(r2.data["results"]), 2)
        all_titles = [t["title"] for t in r1.data["results"]] + [t["title"] for t in r2.data["results"]]
        self.assertTrue(all(title.startswith("Alice Task") for title in all_titles))