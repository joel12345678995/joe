import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Create an account</h1>
        <p className="text-sm text-gray-600 mb-6">
          Registration page placeholder. If you have an invite or registration flow,
          contact your group admin or use the login link below.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-sm text-green-600">
            Sign in
          </Link>
          <Link href="/" className="ml-auto text-sm text-gray-500">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
