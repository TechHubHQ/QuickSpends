import { useLocalSearchParams } from "expo-router";
import QSTripDetailsScreen from "../../src/screens/QSTripDetailsScreen";

export default function TripDetailsRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <QSTripDetailsScreen id={id} />;
}
