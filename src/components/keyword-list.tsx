import { Input } from "@/components/ui/input";
import { IconTrendingDown, IconTrendingUp, IconCirclePlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const keywords = [
  {
    keyword: "example keyword 1",
    timestamp: "2023-01-01T00:00:00Z",
  },
  {
    keyword: "example keyword 2",
    timestamp: "2023-01-02T00:00:00Z",
  },
  {
    keyword: "example keyword 3",
    timestamp: "2023-01-03T00:00:00Z",
  },
  {
    keyword: "example keyword 4",
    timestamp: "2023-01-04T00:00:00Z",
  },
  {
    keyword: "example keyword 5",
    timestamp: "2023-01-05T00:00:00Z",
  },
  {
    keyword: "example keyword 1",
    timestamp: "2023-01-01T00:00:00Z",
  },
  {
    keyword: "example keyword 2",
    timestamp: "2023-01-02T00:00:00Z",
  },
  {
    keyword: "example keyword 3",
    timestamp: "2023-01-03T00:00:00Z",
  },
  {
    keyword: "example keyword 4",
    timestamp: "2023-01-04T00:00:00Z",
  },
  {
    keyword: "example keyword 5",
    timestamp: "2023-01-05T00:00:00Z",
  },
  {
    keyword: "example keyword 1",
    timestamp: "2023-01-01T00:00:00Z",
  },
  {
    keyword: "example keyword 2",
    timestamp: "2023-01-02T00:00:00Z",
  },
  {
    keyword: "example keyword 3",
    timestamp: "2023-01-03T00:00:00Z",
  },
  {
    keyword: "example keyword 4",
    timestamp: "2023-01-04T00:00:00Z",
  },
  {
    keyword: "example keyword 5",
    timestamp: "2023-01-05T00:00:00Z",
  },
  {
    keyword: "example keyword 1",
    timestamp: "2023-01-01T00:00:00Z",
  },
  {
    keyword: "example keyword 2",
    timestamp: "2023-01-02T00:00:00Z",
  },
  {
    keyword: "example keyword 3",
    timestamp: "2023-01-03T00:00:00Z",
  },
  {
    keyword: "example keyword 4",
    timestamp: "2023-01-04T00:00:00Z",
  },
  {
    keyword: "example keyword 5",
    timestamp: "2023-01-05T00:00:00Z",
  },
];

export default function KeywordList() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            <Input />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums mt-5">Słowa kluczowe:</CardTitle>
          <CardAction>
            <Button>
              <IconCirclePlus />
              Dodaj
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Table>
            <TableCaption>A list of your recent keywords.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Słowo</TableHead>
                <TableHead className="text-right">Data dodania</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((keyword, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{keyword.keyword}</TableCell>
                  <TableCell className="text-right">{keyword.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Keywords</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">5</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Acquisition needs attention</div>
        </CardFooter>
      </Card>
    </div>
  );
}
