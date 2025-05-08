import { Link } from "wouter";
import { Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div id="welcome-section" className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 md:p-8 my-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-4">Bienvenue sur MeetFamily</h2>
        <p className="text-gray-600 text-lg mb-6">
          Votre espace pour organiser vos réunions familiales, gérer les cotisations et partager des moments.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/agenda">
            <Button className="bg-primary text-white px-6 py-3 rounded-lg font-heading font-semibold hover:bg-opacity-90 transition-colors duration-200 shadow-md">
              <Calendar className="mr-2 h-5 w-5" />
              Planifier une réunion
            </Button>
          </Link>
          <Link href="/contributions">
            <Button 
              variant="outline"
              className="bg-[#FF7F50] text-white border-0 px-6 py-3 rounded-lg font-heading font-semibold hover:bg-opacity-90 transition-colors duration-200 shadow-md"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Gérer les cotisations
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-bold mb-2">Réunions familiales</h3>
            <p className="text-gray-600 mb-4">Organisez et suivez les agendas de vos réunions familiales.</p>
            <Link href="/agenda">
              <Button variant="link" className="text-primary p-0">
                Voir l'agenda →
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-bold mb-2">Communications</h3>
            <p className="text-gray-600 mb-4">Partagez des annonces et communiquez avec tous les membres.</p>
            <Link href="/announcements">
              <Button variant="link" className="text-primary p-0">
                Voir les annonces →
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-bold mb-2">Souvenirs</h3>
            <p className="text-gray-600 mb-4">Parcourez et partagez des photos et vidéos de vos moments ensemble.</p>
            <Link href="/photos">
              <Button variant="link" className="text-primary p-0">
                Voir la galerie →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
