"""Exercise deployment safety against a fake Management API; never contact Supabase."""
import importlib.util
from pathlib import Path
import os
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("deploy", Path(__file__).parents[2] / "scripts/deploy-supabase.py")
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentSafety(unittest.TestCase):
    def test_missing_credential_cannot_contact_or_modify_a_project(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(deploy.ManagementAPI, "request") as request, patch("sys.argv", ["deploy"]):
            with self.assertRaisesRegex(RuntimeError, "SUPABASE_ACCESS_TOKEN"):
                deploy.main()
            request.assert_not_called()

    def test_target_mismatch_cannot_contact_an_unintended_project(self):
        with patch.dict(os.environ, {"SUPABASE_ACCESS_TOKEN": "test-only", "SUPABASE_PROJECT_REF": "wrong-project"}, clear=True), patch.object(deploy.ManagementAPI, "request") as request, patch("sys.argv", ["deploy", "--apply"]):
            with self.assertRaisesRegex(RuntimeError, "refusing"):
                deploy.main()
            request.assert_not_called()

    def test_existing_untracked_schema_stops_before_any_write_or_function_deployment(self):
        with patch.dict(os.environ, {"SUPABASE_ACCESS_TOKEN": "test-only"}, clear=True), patch.object(deploy.ManagementAPI, "request", return_value={"id": deploy.PROJECT}), patch.object(deploy.ManagementAPI, "query", side_effect=[[{"tablename": "profiles"}], [{"present": False}], []]) as query, patch.object(deploy.ManagementAPI, "deploy_function") as functions, patch("sys.argv", ["deploy", "--apply"]):
            with self.assertRaisesRegex(RuntimeError, "Existing Roomscape"):
                deploy.main()
            self.assertTrue(all(call.args[1:] == () for call in query.call_args_list))
            functions.assert_not_called()

    def test_function_upload_preserves_relative_paths_and_requires_jwt(self):
        api = deploy.ManagementAPI("test-only")
        with patch.object(api, "request") as request:
            api.deploy_function("generate-staged-room")
        path, method, body, content_type = request.call_args.args
        self.assertEqual(path, "/functions/deploy?slug=generate-staged-room")
        self.assertEqual(method, "POST")
        self.assertTrue(content_type.startswith("multipart/form-data; boundary="))
        self.assertIn(b'filename="generate-staged-room/index.ts"', body)
        self.assertIn(b'filename="_shared/security.ts"', body)
        self.assertIn(b'"verify_jwt": true', body)


if __name__ == "__main__":
    unittest.main()
