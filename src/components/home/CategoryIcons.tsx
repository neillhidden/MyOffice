import {
  Tag,
  House,
  BedDouble,
  Sofa,
  CookingPot,
  Utensils,
  Apple,
  Coffee,
  Car,
  Bus,
  Bike,
  Plane,
  HeartPulse,
  Pill,
  Stethoscope,
  GraduationCap,
  BookOpen,
  School,
  Gamepad2,
  Music,
  Film,
  Briefcase,
  Building2,
  Wrench,
  Wallet,
  Banknote,
  CreditCard,
  Landmark,
  Laptop,
  Wifi,
  Smartphone,
  PawPrint,
  Cat,
  Dog,
  Users,
  Baby,
  Heart,
  Gift,
  Package,
  Sparkles,
} from 'lucide-react';

export const CATEGORY_ICON_GROUPS: {
  theme: string;
  icons: [string, string, typeof Tag][];
}[] = [
  {
    theme: 'Casa',
    icons: [
      ['house', 'Casa', House],
      ['bed', 'Quarto', BedDouble],
      ['sofa', 'Mobiliário', Sofa],
    ],
  },
  {
    theme: 'Alimentação',
    icons: [
      ['food', 'Refeições', Utensils],
      ['apple', 'Alimentos', Apple],
      ['coffee', 'Café', Coffee],
      ['cook', 'Cozinha', CookingPot],
    ],
  },
  {
    theme: 'Transporte',
    icons: [
      ['car', 'Carro', Car],
      ['bus', 'Autocarro', Bus],
      ['bike', 'Bicicleta', Bike],
      ['plane', 'Viagens', Plane],
    ],
  },
  {
    theme: 'Saúde',
    icons: [
      ['health', 'Saúde', HeartPulse],
      ['pill', 'Medicamentos', Pill],
      ['doctor', 'Consultas', Stethoscope],
    ],
  },
  {
    theme: 'Educação',
    icons: [
      ['education', 'Estudos', GraduationCap],
      ['book', 'Livros', BookOpen],
      ['school', 'Escola', School],
    ],
  },
  {
    theme: 'Lazer',
    icons: [
      ['games', 'Jogos', Gamepad2],
      ['music', 'Música', Music],
      ['film', 'Cinema', Film],
    ],
  },
  {
    theme: 'Trabalho',
    icons: [
      ['work', 'Trabalho', Briefcase],
      ['business', 'Empresa', Building2],
      ['tools', 'Ferramentas', Wrench],
    ],
  },
  {
    theme: 'Finanças',
    icons: [
      ['wallet', 'Carteira', Wallet],
      ['money', 'Dinheiro', Banknote],
      ['card', 'Cartão', CreditCard],
      ['bank', 'Banco', Landmark],
    ],
  },
  {
    theme: 'Tecnologia',
    icons: [
      ['laptop', 'Computador', Laptop],
      ['wifi', 'Internet', Wifi],
      ['phone', 'Telemóvel', Smartphone],
    ],
  },
  {
    theme: 'Animais',
    icons: [
      ['animals', 'Animais', PawPrint],
      ['cat', 'Gato', Cat],
      ['dog', 'Cão', Dog],
    ],
  },
  {
    theme: 'Família',
    icons: [
      ['family', 'Família', Users],
      ['baby', 'Crianças', Baby],
      ['heart', 'Afetos', Heart],
    ],
  },
  {
    theme: 'Outros',
    icons: [
      ['tag', 'Neutro', Tag],
      ['gift', 'Presentes', Gift],
      ['package', 'Compras', Package],
      ['sparkles', 'Outros', Sparkles],
    ],
  },
];
export const CategoryIcon = ({
  name,
  className = 'h-5 w-5 shrink-0',
}: {
  name?: string;
  className?: string;
}) => {
  const Icon =
    CATEGORY_ICON_GROUPS.flatMap((g) => g.icons).find(
      (i) => i[0] === name,
    )?.[2] ?? Tag;
  return <Icon className={className} aria-hidden="true" />;
};
