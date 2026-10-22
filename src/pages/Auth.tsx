import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { ROOM_IMAGE } from "@/data/studio";
export default function Auth() {
  const [tab, setTab] = useState("signin");
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        id="main-content"
        className="page-width flex flex-1 items-center py-8 sm:py-12"
      >
        <div className="studio-panel grid w-full overflow-hidden lg:grid-cols-2">
          <div className="relative hidden min-h-[650px] lg:block">
            <img
              src={ROOM_IMAGE}
              alt="An inviting living room with natural materials"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-12 left-10 right-10 text-white">
              <Leaf className="mb-5" strokeWidth={1.3} />
              <p className="editorial-title text-5xl">
                A space that feels
                <br />
                like you.
              </p>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">
                Save your ideas. Explore the possibilities. Make yourself at
                home.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md px-6 py-9 sm:px-10 lg:py-14">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 rounded text-xs text-muted-foreground"
            >
              <ArrowLeft size={13} />
              Back to the studio
            </Link>
            <p className="eyebrow mb-3">Welcome to Roomscape</p>
            <h1 className="editorial-title text-4xl">
              {tab === "signin"
                ? "Good to have you here."
                : "Room for something new."}
            </h1>
            <p className="mb-7 mt-3 text-sm leading-relaxed text-muted-foreground">
              {tab === "signin"
                ? "Sign in to bring your next idea to life."
                : "Create an account to save and generate your room designs."}
            </p>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-7 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm onSuccess={() => setTab("signin")} />
              </TabsContent>
            </Tabs>
            <p className="mt-7 border-t pt-5 text-[11px] leading-relaxed text-muted-foreground">
              Your studio preferences stay with you during sign-in. Keep this
              tab open to return to your room photo.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
